const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

// Configurar el servidor
const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear el cuerpo de la solicitud en formato JSON
app.use(bodyParser.json());

// Configuración de CORS para permitir solo solicitudes desde https://maderassanpedro.com
const corsOptions = {
  origin: 'https://maderassanpedro.com',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Permite enviar cookies si es necesario
  optionsSuccessStatus: 200 // Para soportar navegadores antiguos
};

app.use(cors(corsOptions));

// Configuración del transporte de Nodemailer (con tu cuenta de correo de empresa)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Puede ser otro servicio de correo, como Outlook o Mailgun
  auth: {
    user: 'sanpedromadera@gmail.com', // Tu dirección de correo
    pass: 'guoy gegu yzzy sdcq', // Tu contraseña o token de acceso
  },
});

// Endpoint para recibir la cotización
const { body, validationResult } = require('express-validator');

app.post('/send-quote', [
  // Validación de los datos del cliente
  body('customer_info.clientName').trim().notEmpty().withMessage('El nombre del cliente es obligatorio'),
  body('customer_info.clientLastname').trim().notEmpty().withMessage('El apellido del cliente es obligatorio'),
  body('customer_info.clientEmail').isEmail().normalizeEmail().withMessage('El correo electrónico no es válido'),
  body('customer_info.clientPhone').isMobilePhone().withMessage('El teléfono debe ser válido'),

  // Validación de productos
  body('items').isArray().withMessage('Se deben enviar productos en formato de array'),
  body('items.*.name').trim().notEmpty().withMessage('El nombre del producto es obligatorio'),
  body('items.*.category').trim().notEmpty().withMessage('La categoría del producto es obligatoria'),
  body('items.*.description').trim().optional(),
  body('items.*.dimensions').trim().optional(),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('La cantidad debe ser un número mayor que cero'),

], (req, res) => {
  // Validar los datos
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { customer_info, items } = req.body;

  // Lógica para procesar la cotización
  const mailEmpresa = {
    from: 'sanpedromadera@gmail.com',
    to: 'sanpedromadera@gmail.com',
    subject: 'Nueva cotización recibida',
    html: `
      <h2>Detalles de la Cotización</h2>
      <p><strong>Cliente:</strong> ${customer_info.clientName} ${customer_info.clientLastname}</p>
      <p><strong>Email:</strong> ${customer_info.clientEmail}</p>
      <p><strong>Teléfono:</strong> ${customer_info.clientPhone}</p>
      <p><strong>Empresa:</strong> ${customer_info.clientCompany || 'N/A'}</p>
      <h3>Productos solicitados:</h3>
      <ul>
        ${items.map((item) => `
          <li>
            <strong>${item.name}</strong><br>
            Categoría: ${item.category}<br>
            Descripción: ${item.description || 'N/A'}<br>
            Dimensiones: ${item.dimensions || 'N/A'}<br>
            Cantidad: ${item.quantity}<br>
          </li>
        `).join('')}
      </ul>
    `,
  };

  const mailCliente = {
    from: 'glowel.dev@gmail.com',
    to: customer_info.clientEmail,
    subject: 'Cotización recibida',
    html: `
      <h2>Detalles de la Cotización</h2>
      <p>Gracias <strong>${customer_info.clientName} ${customer_info.clientLastname}</strong> por solicitar una cotización con nosotros.</p>
      <h3>Productos solicitados:</h3>
      <ul>
        ${items.map((item) => `
          <li>
            <strong>${item.name}</strong><br>
            Categoría: ${item.category}<br>
            Descripción: ${item.description || 'N/A'}<br>
            Dimensiones: ${item.dimensions || 'N/A'}<br>
            Cantidad: ${item.quantity}<br>
          </li>
        `).join('')}
      </ul>
      <p>En breve nos pondremos en contacto, gracias por confiar en nosotros.</p>
    `,
  };

  transporter.sendMail(mailEmpresa, (error, infoEmpresa) => {
    if (error) {
      console.error('Error al enviar el correo a la empresa:', error);
      return res.status(500).json({ message: 'Error al enviar el correo a la empresa', error });
    }

    transporter.sendMail(mailCliente, (error, infoCliente) => {
      if (error) {
        console.error('Error al enviar el correo al cliente:', error);
        return res.status(500).json({ message: 'Error al enviar el correo al cliente', error });
      }

      res.status(200).json({ message: 'Cotización enviada correctamente', status: 'success' });
    });
  });
});


// Ruta para manejar el formulario
app.post('/contact', [
  // Validación de los datos del formulario de contacto
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().normalizeEmail().withMessage('El correo electrónico no es válido'),
  body('phone').isMobilePhone().withMessage('El teléfono debe ser válido'),
  body('message').trim().notEmpty().withMessage('El mensaje es obligatorio'),
], async (req, res) => {
  // Validar los datos
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, message } = req.body;

  const mailOptions = {
    from: email,
    to: 'sanpedromadera@gmail.com',
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
    res.status(200).json({ message: 'Mensaje enviado exitosamente.' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ error: 'Error al enviar el mensaje. Por favor, intenta nuevamente.' });
  }
});


// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});


