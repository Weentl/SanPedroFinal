// Importar librerías necesarias
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const winston = require('winston');

// Configurar variables de entorno
dotenv.config();

// Validación de variables de entorno
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Error: EMAIL_USER y EMAIL_PASS no están definidos en las variables de entorno');
  process.exit(1);
}

// Configurar el servidor
const app = express();
const port = process.env.PORT || 3000;
console.log('Puerto asignado:', port);  // Verifica que el puerto sea correcto

// Configurar Winston para logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Middleware para parsear el cuerpo de la solicitud en formato JSON
app.use(bodyParser.json());
app.use(helmet());  // Seguridad en cabeceras

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error interno del servidor:', err);
  res.status(500).json({ error: 'Ocurrió un error interno. Por favor intenta más tarde.' });
});

// Limitar la tasa de solicitudes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 solicitudes por IP
  message: 'Demasiadas solicitudes, por favor intenta más tarde.',
});
app.use(limiter);

// Configuración de CORS para permitir solo el dominio especificado
const corsOptions = {
  origin: 'https://maderassanpedro.com', // Cambiar por tu dominio real
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Configuración del transporte de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Variables de entorno
    pass: process.env.EMAIL_PASS,
  },
});

// Endpoint para recibir la cotización
app.post('/send-quote', [
  body('customer_info.clientEmail').isEmail().withMessage('Correo electrónico no válido'),
  body('customer_info.clientName').notEmpty().withMessage('El nombre es obligatorio'),
  // Más validaciones según sea necesario
], (req, res) => {
  console.log('Recibiendo solicitud de cotización:', req.body); // Log para verificar los datos recibidos

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Errores de validación:', errors.array()); // Log de errores de validación
    return res.status(400).json({ errors: errors.array() });
  }

  const { customer_info, items } = req.body; // Extraemos los datos del formulario y productos

  // Crear el contenido del correo
  const mailEmpresa = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Nueva cotización recibida',
    html: `
      <h2>Detalles de la Cotización</h2>
      <p><strong>Cliente:</strong> ${customer_info.clientName} ${customer_info.clientLastname}</p>
      <p><strong>Email:</strong> ${customer_info.clientEmail}</p>
      <p><strong>Teléfono:</strong> ${customer_info.clientPhone}</p>
      <p><strong>Empresa:</strong> ${customer_info.clientCompany || 'N/A'}</p>
      <h3>Productos solicitados:</h3>
      <ul>
        ${items.map(
          (item) => ` 
          <li>
            <strong>${item.name}</strong><br>
            Categoría: ${item.category}<br>
            Descripción: ${item.description}<br>
            Dimensiones: ${item.dimensions}<br>
            Cantidad: ${item.quantity}<br>
          </li>
        `).join('')}
      </ul>
    `,
  };

  const mailCliente = {
    from: process.env.EMAIL_USER,
    to: customer_info.clientEmail,
    subject: 'Cotización recibida',
    html: `
      <h2>Detalles de la Cotización</h2>
      <p>Gracias <strong>${customer_info.clientName} ${customer_info.clientLastname}</strong> por solicitar una cotización con nosotros. A continuación encontrarás los detalles de tu solicitud.</p>
      <h3>Productos solicitados:</h3>
      <ul>
        ${items.map(
          (item) => `
          <li>
            <strong>${item.name}</strong><br>
            Categoría: ${item.category}<br>
            Descripción: ${item.description}<br>
            Dimensiones: ${item.dimensions}<br>
            Cantidad: ${item.quantity}<br>
          </li>
        `).join('')}
      </ul>
      <p>En breve nos pondremos en contacto, gracias por confiar en nosotros.</p>
    `,
  };

  // Enviar el correo a la empresa
  transporter.sendMail(mailEmpresa, (error, infoEmpresa) => {
    if (error) {
      console.error('Error al enviar el correo a la empresa:', error); // Log del error
      logger.error('Error al enviar el correo a la empresa:', error);
      return res.status(500).json({ message: 'Error al enviar el correo a la empresa', error });
    }
    console.log('Correo a la empresa enviado:', infoEmpresa.response); // Log de éxito

    // Enviar el correo al cliente
    transporter.sendMail(mailCliente, (error, infoCliente) => {
      if (error) {
        console.error('Error al enviar el correo al cliente:', error); // Log del error
        logger.error('Error al enviar el correo al cliente:', error);
        return res.status(500).json({ message: 'Error al enviar el correo al cliente', error });
      }
      console.log('Correo al cliente enviado:', infoCliente.response); // Log de éxito

      res.status(200).json({ message: 'Cotización enviada correctamente', status: 'success' });
    });
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});





