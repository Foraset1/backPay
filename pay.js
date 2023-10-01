const stripe = require('stripe')(
  'sk_test_51Nj4P1JsFEu0whUVAm1oAAKaR16nSQncOZQfiRfhRde74PCndYfRoMuez9QOEqkPLUcp1GppuXtRJX5QIXfHrsYM00MZgCcvri'
);
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4242;
app.use(cors({ origin: '*' }));
const axios = require('axios');
// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = 'whsec_6c56f2535717f000316dd0488fad0b2f7ec7d87fac37b9fb5727d8f8fa923ee2';


// Организация информации о продукте
const productInfo = {
  name: 'Gold Special',
  description: 'Описание продукта',
  price: 1999, // Цена в центах (например, $19.99)
  downloadLink: 'https://example.com/download-link',
  images: ['https://example.com/image-url'], // Массив URL изображений продукта
};

app.use(express.json());

// Этот эндпоинт будет обрабатывать запрос на инициирование оплаты
app.post('/initiate-payment', async (req, res) => {
  const { price, images } = req.body;

  try {
    // Создание сессии оплаты с помощью библиотеки Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productInfo.name,
              description: productInfo.description,
              images: productInfo.images,
            },
            unit_amount: price, // Цена в центах
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://vilitas.serveo.net/send-email', // Ссылка на успешную оплату
      cancel_url: 'https://example.com/cancel', // Ссылка на отмену оплаты
    });

    res.json({ paymentLink: session.url });
  } catch (error) {
    console.error('Ошибка при создании сессии оплаты:', error);
    res.status(500).json({ error: 'Ошибка при создании сессии оплаты' });
  }
});

// Обработка события от Stripe Webhooks
// Update your webhook endpoint to handle payment_intent.created
app.post('/stripe_webhooks', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    // Payment was successful, send an email to the client
    const { customer_email } = event.data.object;
    const subject = 'Payment Confirmation';
    const message = 'Thank you for your payment!'; // Customize the email message as needed

 try {
  // Send a request to the second script to send the email
  await axios.post('https://vilitas.serveo.net/send-email', {
    to: 'Foraset1@yandex.com',
  });
 // await sendEmailToClient(customer_email, subject, message);
  console.log('Email sent to', customer_email);
} catch (error) {
  console.error('Error sending email:', error);
}
}

res.status(200).end();
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});