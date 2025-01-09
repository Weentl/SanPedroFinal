// Importar librerías necesarias
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

// Configurar el servidor
const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear el cuerpo de la solicitud en formato JSON
app.use(bodyParser.json());

// Configuración del transporte de Nodemailer (con tu cuenta de correo de empresa)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Puede ser otro servicio de correo, como Outlook o Mailgun
  auth: {
    user: 'glowel.dev@gmail.com', // Tu correo de empresa
    pass: 'jymu nofg pyyh fwko', // Contraseña de tu cuenta (o app password si usas 2FA)
  },
});

// Endpoint para recibir la cotización
app.post('/send-quote', (req, res) => {
  const { customer_info, items } = req.body; // Extraemos los datos del formulario y productos

  // Crear el contenido del correo
  const mailOptions = {
    from: 'glowel.dev@gmail.com', // Remitente (correo de empresa)
    to: 'glowel.dev@gmail.com', // Destinatario (correo de la empresa)
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

  // Enviar el correo
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar el correo:', error);
      return res.status(500).json({ message: 'Error al enviar el correo', error });
    }
    console.log('Correo enviado:', info.response);
    res.status(200).json({ message: 'Cotización enviada correctamente', status: 'success' });
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});


