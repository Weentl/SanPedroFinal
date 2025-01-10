// Importar librerías necesarias
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

// Configurar el servidor
const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear el cuerpo de la solicitud en formato JSON
app.use(bodyParser.json());
app.use(cors());  // Permite solicitudes de cualquier origen

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
  const mailEmpresa = {
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

  const mailcliente = {
    from: 'glowel.dev@gmail.com', // Remitente (correo de empresa)
    to: customer_info.clientEmail, // Destinatario (correo de la empresa)
    subject: 'Cotización recibida',
    html: `
      <h2>Detalles de la Cotización</h2>
      <p>Gracias <strong>${customer_info.clientName} ${customer_info.clientLastname} </strong> por solicitar una cotización con nosotros, a continuación encontrarás los detalles de tu solicitud.</p>
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

  // Enviar el correo
  transporter.sendMail(mailEmpresa, (error, info) => {
    if (error) {
      console.error('Error al enviar el correo:', error);
      return res.status(500).json({ message: 'Error al enviar el correo', error });
    }
    console.log('Correo enviado:', info.response);
    res.status(200).json({ message: 'Cotización enviada correctamente', status: 'success' });
  });

  // Enviar el correo
  transporter.sendMail(mailcliente, (error, info) => {
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


