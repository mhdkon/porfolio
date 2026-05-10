require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();

// Logs
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// CORS
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON con límite aumentado para imágenes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ========================================================
// FUNCIONES DE UTILIDAD
// ========================================================

// Función para normalizar imágenes: asegurar que sea un array válido
const normalizeImages = (images) => {
  if (!images) return null;
  
  // Si ya es array
  if (Array.isArray(images)) {
    const validImages = images.filter(img => 
      img && typeof img === 'string' && 
      (img.startsWith('data:image') || img.startsWith('http'))
    );
    return validImages.length > 0 ? validImages : null;
  }
  
  // Si es string
  if (typeof images === 'string') {
    // Intentar parsear JSON
    if (images.startsWith('[')) {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) {
          const validImages = parsed.filter(img => 
            img && typeof img === 'string' && 
            (img.startsWith('data:image') || img.startsWith('http'))
          );
          return validImages.length > 0 ? validImages : null;
        }
        return null;
      } catch (e) {
        // Si falla el parseo, verificar si es una imagen directa
        if (images.startsWith('data:image') && images.length > 100) {
          return [images];
        }
        return null;
      }
    }
    
    // Si es una imagen base64 directa
    if (images.startsWith('data:image') && images.length > 100) {
      return [images];
    }
  }
  
  return null;
};

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }
  
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Acceso denegado. Se requieren privilegios de administrador." });
  }
  next();
};

// ========================================================
// 👤 REGISTRO
// ========================================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'user') RETURNING id, name, email, role",
      [name, email, hashed]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    console.error("Error en registro:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// 🔐 LOGIN
// ========================================================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Password incorrecta" });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// 👥 USERS (solo admin)
// ========================================================
app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) {
      return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
    }
    
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// 🏠 PROPIEDADES
// ========================================================

// POST - Crear propiedad
app.post("/api/properties", authMiddleware, async (req, res) => {
  try {
    const {
      title, description, price, province, city, street,
      bedrooms, bathrooms, area, propertytype, occupied, reo,
      lat, lng, images
    } = req.body;

    console.log("=" .repeat(60));
    console.log("📥 RECIBIDA NUEVA PROPIEDAD");
    console.log("Título:", title);
    console.log("Precio:", price);
    console.log("Ubicación:", city, province);
    console.log("Imágenes recibidas:", images ? (Array.isArray(images) ? images.length : typeof images) : 0);
    
    // Validar y procesar imágenes
    let imagesToSave = null;
    if (images && Array.isArray(images) && images.length > 0) {
      // Filtrar solo imágenes base64 válidas
      const validImages = images.filter(img => {
        const isValid = img && typeof img === 'string' && 
                       img.startsWith('data:image') && 
                       img.length > 100;
        if (!isValid) {
          console.log("⚠️ Imagen inválida detectada:", img ? img.substring(0, 50) : 'null');
        }
        return isValid;
      });
      
      if (validImages.length > 0) {
        // Guardar como JSON string para PostgreSQL
        imagesToSave = JSON.stringify(validImages);
        console.log(`✅ Guardando ${validImages.length} imágenes válidas`);
        console.log(`📊 Tamaño total imágenes: ${(imagesToSave.length / 1024).toFixed(2)} KB`);
      } else {
        console.warn("⚠️ No hay imágenes válidas para guardar");
      }
    }

    // Insertar en la base de datos
    const result = await pool.query(
      `INSERT INTO properties (
        title, description, price, province, city, street,
        bedrooms, bathrooms, area, propertytype,
        occupied, reo, lat, lng, images, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        title, 
        description || '', 
        price, 
        province, 
        city, 
        street,
        bedrooms || 0, 
        bathrooms || 0, 
        area || 0, 
        propertytype || 'casa',
        occupied || false, 
        reo || false, 
        lat || null, 
        lng || null,
        imagesToSave,
        req.user.id
      ]
    );

    const newProperty = result.rows[0];
    
    // Normalizar imágenes para la respuesta
    const normalizedImages = normalizeImages(newProperty.images);
    
    // Obtener información del agente
    const userResult = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1", 
      [req.user.id]
    );
    const agent = userResult.rows[0] || null;

    console.log("✅ Propiedad creada con ID:", newProperty.id);
    console.log("Imágenes en respuesta:", normalizedImages ? normalizedImages.length : 0);
    console.log("=" .repeat(60));

    // Responder con la propiedad creada
    res.json({
      id: newProperty.id,
      title: newProperty.title,
      description: newProperty.description,
      price: newProperty.price,
      province: newProperty.province,
      city: newProperty.city,
      street: newProperty.street,
      bedrooms: newProperty.bedrooms,
      bathrooms: newProperty.bathrooms,
      area: newProperty.area,
      propertytype: newProperty.propertytype,
      occupied: newProperty.occupied,
      reo: newProperty.reo,
      lat: newProperty.lat,
      lng: newProperty.lng,
      images: normalizedImages,
      user_id: newProperty.user_id,
      createdAt: newProperty.created_at,
      updatedAt: newProperty.updated_at,
      agent: agent ? { id: agent.id, name: agent.name, email: agent.email } : null
    });
    
  } catch (err) {
    console.error("❌ Error al crear propiedad:", err);
    res.status(500).json({ error: err.message, details: err.stack });
  }
});

// GET - Listar propiedades con filtros
app.get("/api/properties", async (req, res) => {
  try {
    const { 
      province, city, propertytype, priceMin, priceMax, 
      bedrooms, bathrooms, occupied, reo 
    } = req.query;

    let query = `
      SELECT p.*, u.id as agent_id, u.name as agent_name, u.email as agent_email
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    let values = [];
    let paramCount = 1;

    if (province) {
      values.push(province);
      query += ` AND p.province = $${paramCount++}`;
    }
    if (city) {
      values.push(city);
      query += ` AND p.city = $${paramCount++}`;
    }
    if (propertytype) {
      values.push(propertytype);
      query += ` AND p.propertytype = $${paramCount++}`;
    }
    if (priceMin) {
      values.push(priceMin);
      query += ` AND p.price >= $${paramCount++}`;
    }
    if (priceMax) {
      values.push(priceMax);
      query += ` AND p.price <= $${paramCount++}`;
    }
    if (bedrooms) {
      values.push(bedrooms);
      query += ` AND p.bedrooms >= $${paramCount++}`;
    }
    if (bathrooms) {
      values.push(bathrooms);
      query += ` AND p.bathrooms >= $${paramCount++}`;
    }
    if (occupied !== undefined && occupied !== '') {
      values.push(occupied === "true");
      query += ` AND p.occupied = $${paramCount++}`;
    }
    if (reo !== undefined && reo !== '') {
      values.push(reo === "true");
      query += ` AND p.reo = $${paramCount++}`;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, values);
    
    console.log(`📊 Consulta ejecutada: ${result.rows.length} propiedades encontradas`);

    const properties = result.rows.map(row => {
      const normalizedImages = normalizeImages(row.images);
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        price: parseFloat(row.price),
        province: row.province,
        city: row.city,
        street: row.street,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        area: row.area,
        propertytype: row.propertytype,
        occupied: row.occupied,
        reo: row.reo,
        lat: row.lat ? parseFloat(row.lat) : null,
        lng: row.lng ? parseFloat(row.lng) : null,
        images: normalizedImages,
        user_id: row.user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        agent: row.agent_id ? { 
          id: row.agent_id, 
          name: row.agent_name,
          email: row.agent_email
        } : null
      };
    });

    const withImages = properties.filter(p => p.images && p.images.length > 0).length;
    console.log(`📋 Enviando ${properties.length} propiedades. Con imágenes: ${withImages}`);

    res.json(properties);
  } catch (err) {
    console.error("❌ Error al obtener propiedades:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT - Actualizar propiedad
app.put("/api/properties/:id", authMiddleware, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verificar propiedad existe y permisos
    const propResult = await pool.query(
      "SELECT user_id FROM properties WHERE id = $1", 
      [propertyId]
    );
    
    if (propResult.rows.length === 0) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }
    
    const propertyOwnerId = propResult.rows[0].user_id;

    if (userRole !== 'admin' && propertyOwnerId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para modificar esta propiedad" });
    }

    const fields = req.body;
    const validFields = [
      'title', 'description', 'price', 'province', 'city', 'street',
      'bedrooms', 'bathrooms', 'area', 'propertytype', 'occupied', 'reo',
      'lat', 'lng', 'images'
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const field of validFields) {
      if (fields.hasOwnProperty(field)) {
        let value = fields[field];
        
        if (field === 'images') {
          // Procesar imágenes
          if (value && Array.isArray(value) && value.length > 0) {
            const validImages = value.filter(img => 
              img && typeof img === 'string' && img.startsWith('data:image') && img.length > 100
            );
            value = validImages.length > 0 ? JSON.stringify(validImages) : null;
          } else {
            value = null;
          }
        }
        
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    values.push(propertyId);
    const updateQuery = `UPDATE properties SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(updateQuery, values);
    const updatedProperty = result.rows[0];

    const userResult = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1", 
      [updatedProperty.user_id]
    );
    const agent = userResult.rows[0] || null;

    res.json({
      id: updatedProperty.id,
      title: updatedProperty.title,
      description: updatedProperty.description,
      price: updatedProperty.price,
      province: updatedProperty.province,
      city: updatedProperty.city,
      street: updatedProperty.street,
      bedrooms: updatedProperty.bedrooms,
      bathrooms: updatedProperty.bathrooms,
      area: updatedProperty.area,
      propertytype: updatedProperty.propertytype,
      occupied: updatedProperty.occupied,
      reo: updatedProperty.reo,
      lat: updatedProperty.lat,
      lng: updatedProperty.lng,
      images: normalizeImages(updatedProperty.images),
      user_id: updatedProperty.user_id,
      createdAt: updatedProperty.created_at,
      updatedAt: updatedProperty.updated_at,
      agent: agent ? { id: agent.id, name: agent.name, email: agent.email } : null
    });
  } catch (err) {
    console.error("❌ Error en actualización:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar propiedad
app.delete("/api/properties/:id", authMiddleware, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const propResult = await pool.query(
      "SELECT user_id FROM properties WHERE id = $1", 
      [propertyId]
    );
    
    if (propResult.rows.length === 0) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }
    
    const propertyOwnerId = propResult.rows[0].user_id;

    if (userRole !== 'admin' && propertyOwnerId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta propiedad" });
    }

    await pool.query("DELETE FROM properties WHERE id = $1", [propertyId]);
    res.json({ message: "Propiedad eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar propiedad:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// ❤️ FAVORITOS
// ========================================================
app.post("/api/favorites/:id", authMiddleware, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    await pool.query(
      "INSERT INTO favorites (user_id, property_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", 
      [req.user.id, propertyId]
    );
    res.json({ message: "Añadido a favoritos" });
  } catch (err) {
    console.error("Error al añadir favorito:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/favorites", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.id as agent_id, u.name as agent_name, u.email as agent_email
       FROM favorites f
       JOIN properties p ON p.id = f.property_id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    const favorites = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      price: parseFloat(row.price),
      province: row.province,
      city: row.city,
      street: row.street,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      area: row.area,
      propertytype: row.propertytype,
      occupied: row.occupied,
      reo: row.reo,
      lat: row.lat ? parseFloat(row.lat) : null,
      lng: row.lng ? parseFloat(row.lng) : null,
      images: normalizeImages(row.images),
      user_id: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      agent: row.agent_id ? { 
        id: row.agent_id, 
        name: row.agent_name,
        email: row.agent_email
      } : null
    }));
    
    res.json(favorites);
  } catch (err) {
    console.error("Error al obtener favoritos:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/favorites/:id", authMiddleware, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND property_id = $2", 
      [req.user.id, propertyId]
    );
    res.json({ message: "Eliminado de favoritos" });
  } catch (err) {
    console.error("Error al eliminar favorito:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// 👑 Crear administrador por defecto
// ========================================================
const createDefaultAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@inmobiliaria.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Administrador";

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')",
        [adminName, adminEmail, hashedPassword]
      );
      console.log(`✅ Usuario administrador creado: ${adminEmail}`);
    } else {
      console.log(`ℹ️ El administrador ${adminEmail} ya existe.`);
    }
  } catch (err) {
    console.error("❌ Error al crear administrador:", err.message);
  }
};

// ========================================================
// 🚀 SERVER
// ========================================================
const PORT = process.env.PORT || 3000;

pool.connect()
  .then(async () => {
    console.log("✅ Conexión a PostgreSQL establecida");
    await createDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📡 API disponible en http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error("❌ Error conectando a PostgreSQL:", err.message);
    process.exit(1);
  });