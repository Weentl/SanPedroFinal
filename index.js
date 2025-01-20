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

// Configurar el servidor
const app = express();
const port = process.env.PORT || 3000;

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
// Ejemplo de manejo de errores en el backend
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
  origin: 'https://maderassanpedro.com',
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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
        `
        ).join('')}
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
        `
        ).join('')}
      </ul>
      <p>En breve nos pondremos en contacto, gracias por confiar en nosotros.</p>
    `,
  };

  // Enviar el correo a la empresa
  transporter.sendMail(mailEmpresa, (error, infoEmpresa) => {
    if (error) {
      logger.error('Error al enviar el correo a la empresa:', error);
      return res.status(500).json({ message: 'Error al enviar el correo a la empresa', error });
    }
    logger.info('Correo a la empresa enviado:', infoEmpresa.response);

    // Enviar el correo al cliente
    transporter.sendMail(mailCliente, (error, infoCliente) => {
      if (error) {
        logger.error('Error al enviar el correo al cliente:', error);
        return res.status(500).json({ message: 'Error al enviar el correo al cliente', error });
      }
      logger.info('Correo al cliente enviado:', infoCliente.response);

      res.status(200).json({ message: 'Cotización enviada correctamente', status: 'success' });
    });
  });
});

// Ruta para manejar el formulario de contacto
app.post('/contact', [
  body('name').notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Correo electrónico no válido'),
  body('phone').notEmpty().withMessage('El teléfono es obligatorio'),
  body('message').notEmpty().withMessage('El mensaje es obligatorio'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, message } = req.body;

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: 'Nuevo mensaje del formulario de contacto',
    text: `
      Nombre: ${name}
      Correo: ${email}
      Teléfono: ${phone}
      Mensaje: ${message}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Mensaje del formulario enviado exitosamente.');
    res.status(200).json({ message: 'Mensaje enviado exitosamente.' });
  } catch (error) {
    logger.error('Error al enviar el mensaje del formulario:', error);
    res.status(500).json({ error: 'Error al enviar el mensaje. Por favor, intenta nuevamente.' });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Ocurrió un error interno. Por favor intenta más tarde.' });
});

// Iniciar el servidor
app.listen(port, () => {
  logger.info(`Servidor escuchando en http://localhost:${port}`);
});



