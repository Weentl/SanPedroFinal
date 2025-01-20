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
    user: 'sanpedromadera@gmail.com', // Tu correo de empresa
    pass: 'guoy gegu yzzy sdcq', // Contraseña de tu cuenta (o app password si usas 2FA)
  },
});

// Endpoint para recibir la cotización
app.post('/send-quote', (req, res) => {
  const { customer_info, items } = req.body; // Extraemos los datos del formulario y productos

  // Crear el contenido del correo
  const mailEmpresa = {
    from: 'sanpedromadera@gmail.com', // Remitente (correo de empresa)
    to: 'sanpedromadera@gmail.com', // Destinatario (correo de la empresa)
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
    from: 'sanpedromadera@gmail.com', // Remitente (correo de empresa)
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

  // Enviar el correo a la empresa
  transporter.sendMail(mailEmpresa, (error, infoEmpresa) => {
    if (error) {
      console.error('Error al enviar el correo a la empresa:', error);
      return res.status(500).json({ message: 'Error al enviar el correo a la empresa', error });
    }
    console.log('Correo a la empresa enviado:', infoEmpresa.response);

    // Enviar el correo al cliente
    transporter.sendMail(mailcliente, (error, infoCliente) => {
      if (error) {
        console.error('Error al enviar el correo al cliente:', error);
        return res.status(500).json({ message: 'Error al enviar el correo al cliente', error });
      }
      console.log('Correo al cliente enviado:', infoCliente.response);

      res.status(200).json({ message: 'Cotización enviada correctamente', status: 'success' });
    });
  });
});

// Ruta para manejar el formulario
app.post('/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  // Configuración de nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Puede ser otro servicio de correo, como Outlook o Mailgun
    auth: {
      user: 'sanpedromadera@gmail.com', // Tu correo de empresa
      pass: 'guoy gegu yzzy sdcq', // Contraseña de tu cuenta (o app password si usas 2FA)
    },
  });

  const mailOptions = {
    from: email,
    to: 'sanpedromadera@gmail.com', // Cambia esto por el correo donde deseas recibir los mensajes
    subject: 'Nuevo mensaje del formulario de contacto',
    html: `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>Correo:</strong> ${email}</p>
      <p><strong>Teléfono:</strong> ${phone}</p>
      <p><strong>Mensaje:</strong> ${message}</p>
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


