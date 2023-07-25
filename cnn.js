const express = require('express');
const bodyParse = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const port = require('./port');
const app = express();
 
//prueba
const { clientFacturacion } = require('./database');

app.use(bodyParse.urlencoded({ extended: false }));
app.use(bodyParse.json());
app.use(cors());

//Hola mundo en el servidor de bienvenida 
app.get('/', (req, res) => {
    res.send('Hola mundo,  esta es una API Rest de facturacion');
});


// obtener los datos de auditoria
app.get('/api/FactAuditoria', (req, res) => {

    clientFacturacion.query('SELECT * FROM "FactAuditoria" ORDER BY "aud_id"')
        .then(response => {
            res.json(response.rows);
        })
        .catch(err => {
            console.log(err);
        });
});

//filtrar los datos de la auditoria por fecha inicio y fecha fin
app.get('/api/FactAuditoria/:fechaInicio/:fechaFin', (req, res) => {
    const fechaInicio = req.params.fechaInicio;
    const fechaFin = req.params.fechaFin;
    const query = `SELECT * FROM public."FactAuditoria" WHERE "aud_fecha" BETWEEN $1 AND $2`;
    const values = [fechaInicio, fechaFin];
    clientFacturacion.query(query, values)

        .then(response => {
            res.json(response.rows);
        })
        .catch(err => {
            console.log(err);
        });
});



// obtener los datos de los productos
app.get('/api/FactClientes', (req, res) => {

    clientFacturacion.query('SELECT * FROM "FactCliente" ORDER BY "Identificacion"')
        .then(response => {
            res.json(response.rows);
        })
        .catch(err => {
            console.log(err);
        });
});

//hacer una lista de clientes con las facturas que se hayan creado
app.get('/api/FactClientes/Facturas', (req, res) => {
    const query = `SELECT "FactCliente"."Identificacion", "FactCliente"."Nombre", "FactCliente"."FechaNacimiento",
                    "FactCliente"."Direccion", "FactCliente"."Telefono", "FactCliente"."CorreoElectronico",
                    "FactCliente"."Estado", "FactFacturaCabecera"."IdFacturaCabecera", "FactFacturaCabecera"."FechaFactura",
                    "FactFacturaCabecera"."Subtotal", "FactFacturaCabecera"."Iva", "FactFacturaCabecera"."Total",
                    "FactFacturaCabecera"."Estado", "FactFacturaCabecera"."NumeroFactura", "FactFacturaCabecera"."IdentificacionCliente",
                    "FactFacturaCabecera"."IdTipo"
                    FROM public."FactCliente"
                    INNER JOIN public."FactFacturaCabecera" ON "FactCliente"."Identificacion" = "FactFacturaCabecera"."IdentificacionCliente"
                    ORDER BY "FactCliente"."Identificacion"`;

    clientFacturacion.query(query)

        .then(response => {
            res.json(response.rows);
        })
        .catch(err => {
            console.log(err);
        });
});

    
// Obtener cliente por ID
app.get('/api/FactClientes/:id', (req, res) => {
    const idCliente = req.params.id;
    const query = `SELECT * FROM public."FactCliente" WHERE "Identificacion" = $1`;
    const values = [idCliente];
    clientFacturacion.query(query, values)
        .then(response => {
            if (response.rows.length > 0) {
                res.json(response.rows[0]);
            } else {
                res.status(404).json({ message: 'Cliente no encontrado' });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});


// hacer una lista de clientes por id con las facturas que se hayan creado
app.get('/api/FactClientes/Facturas/:identificacionCliente', (req, res) => {
    const identificacionCliente = req.params.identificacionCliente;

    const query = `SELECT "FactFacturaCabecera"."IdFacturaCabecera", "FactFacturaCabecera"."FechaFactura",
                    "FactFacturaCabecera"."Subtotal", "FactFacturaCabecera"."Iva", "FactFacturaCabecera"."Total",
                    "FactFacturaCabecera"."Estado", "FactFacturaCabecera"."NumeroFactura", "FactFacturaCabecera"."IdentificacionCliente",
                    "FactFacturaCabecera"."IdTipo"
                    FROM public."FactCliente"
                    INNER JOIN public."FactFacturaCabecera" ON "FactCliente"."Identificacion" = "FactFacturaCabecera"."IdentificacionCliente"
                    WHERE "FactCliente"."Identificacion" = $1
                    ORDER BY "FactCliente"."Identificacion"`;

    clientFacturacion.query(query, [identificacionCliente])
        .then(response => {
            res.json(response.rows);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: 'Error al obtener las facturas del cliente.' });
        });
});


// Insertar un cliente
app.post('/api/FactClientes', (req, res) => {
    const { Identificacion, Nombre, FechaNacimiento, Direccion, Telefono, CorreoElectronico, Estado } = req.body;
    const query = `INSERT INTO public."FactCliente" ("Identificacion", "Nombre", "FechaNacimiento", 
                    "Direccion", "Telefono", "CorreoElectronico", "Estado")
                   VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    const values = [Identificacion, Nombre, FechaNacimiento, Direccion, Telefono, CorreoElectronico, Estado];
    clientFacturacion.query(query, values)
        .then(() => {
            res.status(201).json({ message: 'Cliente agregado' });
        })
        .catch(err => {
            console.error(err);
            res.status(400).json({ message: 'Error al agregar cliente' });
        });
});

// Actualizar un cliente por ID
app.put('/api/FactClientes/:id', (req, res) => {
    const idCliente = req.params.id;
    const { Nombre, FechaNacimiento, Direccion, Telefono, CorreoElectronico, Estado } = req.body;
    const query = `UPDATE public."FactCliente" 
                   SET "Nombre" = $1, "FechaNacimiento" = $2, "Direccion" = $3, 
                        "Telefono" = $4, "CorreoElectronico" = $5, "Estado" = $6
                   WHERE "Identificacion" = $7`;
    const values = [Nombre, FechaNacimiento, Direccion, Telefono, CorreoElectronico, Estado, idCliente];
    clientFacturacion.query(query, values)
        .then(() => {
            res.json({ message: 'Cliente actualizado' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});


// Eliminar un cliente por ID
app.delete('/api/FactClientes/:id', (req, res) => {
    const idCliente = req.params.id;
    const query = `DELETE FROM public."FactCliente" WHERE "Identificacion" = $1`;
    const values = [idCliente];
    clientFacturacion.query(query, values)
        .then(() => {
            res.json({ message: 'Cliente eliminado' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});

// Obtener todos los tipos de pago
app.get('/api/FactTipoPagos', (req, res) => {
    const query = 'SELECT "IdTipoPago", "Tipo" FROM public."FactTipoPago"';
    clientFacturacion.query(query)
        .then(response => {
            res.json(response.rows);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});


// Obtener un tipo de pago por ID
app.get('/api/FactTipoPagos/:id', (req, res) => {
    const idTipoPago = req.params.id;
    const query = 'SELECT "IdTipoPago", "Tipo" FROM public."FactTipoPago" WHERE "IdTipoPago" = $1';
    const values = [idTipoPago];
    clientFacturacion.query(query, values)
        .then(response => {
            if (response.rows.length > 0) {
                res.json(response.rows[0]);
            } else {
                res.status(404).json({ message: 'Tipo de pago no encontrado' });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});


// Insertar un tipo de pago
app.post('/api/FactTipoPagos', (req, res) => {
    const { IdTipoPago, Tipo } = req.body;
    const query = 'INSERT INTO public."FactTipoPago" ("IdTipoPago", "Tipo") VALUES ($1, $2)';
    const values = [IdTipoPago, Tipo];
    clientFacturacion.query(query, values)
        .then(() => {
            res.status(201).json({ message: 'Tipo de pago agregado' });
        })
        .catch(err => {
            console.error(err);
            res.status(400).json({ message: 'Error al agregar tipo de pago' });
        });
});


// Actualizar un tipo de pago por ID
app.put('/api/FactTipoPagos/:id', (req, res) => {
    const idTipoPago = req.params.id;
    const { Tipo } = req.body;
    const query = 'UPDATE public."FactTipoPago" SET "Tipo" = $1 WHERE "IdTipoPago" = $2';
    const values = [Tipo, idTipoPago];
    clientFacturacion.query(query, values)
        .then(() => {
            res.json({ message: 'Tipo de pago actualizado' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});

// Eliminar un tipo de pago por ID
app.delete('/api/FactTipoPagos/:id', (req, res) => {
    const idTipoPago = req.params.id;
    const query = 'DELETE FROM public."FactTipoPago" WHERE "IdTipoPago" = $1';
    const values = [idTipoPago];
    clientFacturacion.query(query, values)
        .then(() => {
            res.json({ message: 'Tipo de pago eliminado' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});

// Obtener todas las facturas de cabecera
app.get('/api/FactFacturaCabecera', (req, res) => {
    clientFacturacion.query('SELECT * FROM public."FactFacturaCabecera"')
        .then(response => {
            res.json(response.rows);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});

// Obtener una factura de cabecera por su ID
app.get('/api/FactFacturaCabecera/:id', (req, res) => {
    const idFacturaCabecera = req.params.id;
    const query = `SELECT * FROM public."FactFacturaCabecera" WHERE "IdFacturaCabecera" = $1`;
    const values = [idFacturaCabecera];
    clientFacturacion.query(query, values)
        .then(response => {
            if (response.rows.length === 0) {
                res.status(404).json({ message: 'Factura de cabecera no encontrada' });
            } else {
                res.json(response.rows[0]);
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});

// Obtener todos los detalles de factura
app.get('/api/FactDetalleFactura', (req, res) => {
    clientFacturacion.query('SELECT * FROM public."FactDetalleFactura"')
        .then(response => {
            res.json(response.rows);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});

// Obtener un detalle de factura por su ID
app.get('/api/FactDetalleFactura/:id', (req, res) => {
    const idDetalleFactura = req.params.id;
    const query = `SELECT * FROM public."FactDetalleFactura" WHERE "IdDetalleFactura" = $1`;
    const values = [idDetalleFactura];
    clientFacturacion.query(query, values)
        .then(response => {
            if (response.rows.length === 0) {
                res.status(404).json({ message: 'Detalle de factura no encontrado' });
            } else {
                res.json(response.rows[0]);
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});

// Obtener detalles de factura por el ID de la cabecera de factura
app.get('/api/FactDetalleFactura/FacturaCabecera/:id', (req, res) => {
    const facturaCabeceraId = req.params.id;
    const query = `SELECT * FROM public."FactDetalleFactura" WHERE "IdFacturaCabecera" = $1`;
    const values = [facturaCabeceraId];
    clientFacturacion.query(query, values)
        .then(response => {
            res.json(response.rows);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});

// Registrar factura
// Registrar factura
app.post('/api/FactFacturacion', (req, res) => {
    const { FechaFactura, Subtotal, Iva, Total, Estado, NumeroFactura, IdentificacionCliente, IdTipo, 
                    Detalles } = req.body;

    let facturaCabeceraId;

    // Primero insertamos la cabecera de la factura
    const queryCabecera = `INSERT INTO public."FactFacturaCabecera" ("FechaFactura", "Subtotal", "Iva", 
                                "Total", "Estado", "NumeroFactura", "IdentificacionCliente", "IdTipo") 
                           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "IdFacturaCabecera"`;
    const valuesCabecera = [FechaFactura, Subtotal, Iva, Total, Estado, NumeroFactura, IdentificacionCliente,
                                 IdTipo];

    clientFacturacion.query(queryCabecera, valuesCabecera)
        .then(response => {
            facturaCabeceraId = response.rows[0].IdFacturaCabecera;

            // Luego, insertamos los detalles de la factura uno por uno
            const insertDetallePromises = Detalles.map(detalle => {
                const { Cantidad, Subtotal, IdProducto } = detalle;
                const queryDetalle = `INSERT INTO public."FactDetalleFactura" ("Cantidad", "Subtotal", 
                                                "IdProducto", "IdFacturaCabecera")
                                       VALUES ($1, $2, $3, $4)`;
                const valuesDetalle = [Cantidad, Subtotal, IdProducto, facturaCabeceraId];
                return clientFacturacion.query(queryDetalle, valuesDetalle);
            });

            return Promise.all(insertDetallePromises);
        })
        .then(() => {
            res.status(201).json({ message: 'Factura registrada correctamente' });
        })
        .catch(err => {
            console.error(err);
            res.status(400).json({ message: 'Error al registrar la factura' });
        });
});


// Obtener todos los productos
app.get('/api/productos', (req, res) => {
    const query = `SELECT pro_id, pro_nombre, pro_descripcion, pro_valor_iva, pro_costo, pro_pvp, 
                    pro_imagen, cat_id, pro_stock
                   FROM public.productos`;

    clientFacturacion.query(query)
        .then(response => {
            const productos = response.rows;
            res.json(productos);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});

// Obtener un producto por su ID
app.get('/api/productos/:id', (req, res) => {
    const idProducto = req.params.id;
    const query = `SELECT pro_id, pro_nombre, pro_descripcion, pro_valor_iva, pro_costo, pro_pvp, 
                        pro_imagen, cat_id, pro_stock
                   FROM public.productos
                   WHERE pro_id = $1`;

    clientFacturacion.query(query, [idProducto])
        .then(response => {
            const producto = response.rows[0];
            if (!producto) {
                res.status(404).json({ message: 'Producto no encontrado' });
            } else {
                res.json(producto);
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Error en el servidor' });
        });
});

// Obtener los productos desde la API externa
const obtenerProductosDesdeAPI = async () => {
    try {
      const API_URL = 'https://inventarioproductos.onrender.com/productos';
      const headers = {
        Authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Ik1hdGVpdG8iLCJpYXQiOjE2OTAyNDQ1MDYsImV4cCI6MTY5MDUwMzcwNn0.rvy8Ct3ERN0bCm-mAwH0KOqGue2ZPWthtBYFKn8ZhIc',
      };
  
      const response = await axios.get(API_URL, { headers });
      return response.data;
    } catch (error) {
      console.error('Error al obtener los productos desde la API:', error.message);
      return [];
    }
  };

  
 // Función para verificar si un producto existe en la base de datos
const productoExiste = async (pro_id) => {
    const query = `SELECT COUNT(*) FROM public.productos WHERE pro_id = $1`;
    const values = [pro_id];
    const result = await clientFacturacion.query(query, values);
    return result.rows[0].count > 0;
  };
  
  // Insertar productos en la tabla "productos" si no existen
  const insertarProductos = async (productos) => {
    try {
      for (const producto of productos) {
        const { pro_id, pro_nombre, pro_descripcion, pro_valor_iva, pro_costo, pro_pvp, pro_imagen, 
                        cat_id, pro_stock } = producto;
        const productoExisteEnDB = await productoExiste(pro_id);
        
        if (!productoExisteEnDB) {
          const query = `INSERT INTO public.productos (pro_id, pro_nombre, pro_descripcion, pro_valor_iva, 
                            pro_costo, pro_pvp, pro_imagen, cat_id, pro_stock)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
          const values = [pro_id, pro_nombre, pro_descripcion, pro_valor_iva, pro_costo, pro_pvp, pro_imagen,
                                 cat_id, pro_stock];
          await clientFacturacion.query(query, values);
        }
      }
    
      console.log('Productos insertados correctamente en la base de datos.');
    } catch (error) {
      console.error('Error al insertar productos en la base de datos:', error.message);
    }
  };
  
  // Ruta para obtener y guardar los productos desde la API externa
  app.get('/guardarproductos', async (req, res) => {
    try {
      const productos = await obtenerProductosDesdeAPI();
      await insertarProductos(productos);
      res.send('Productos obtenidos y guardados en la base de datos.');
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener y guardar los productos.' });
    }
  });
  
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor en ejecución en el puerto: http://localhost:${port}`);
  });