export const newUserRegistrationTemplate = (firstName: string): string => {
  return `<!DOCTYPE html>
  <html>
  <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Selamat Datang di Mutari!</title>
          <style>
                  body {
                          font-family: Arial, sans-serif;
                          background-color: #f4f4f4;
                          margin: 0;
                          padding: 0;
                  }
                  .container {
                          max-width: 600px;
                          margin: 20px auto;
                          background: #ffffff;
                          padding: 20px;
                          border-radius: 8px;
                          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                          text-align: center;
                  }
                  .header img {
                          max-width: 150px;
                          margin: 20px auto;
                  }
                  h3 {
                          color: #2c3e50;
                  }
                  p {
                          color: #555;
                          font-size: 16px;
                          line-height: 1.6;
                  }
                  .code {
                          display: inline-block;
                          background: #007bff;
                          color: #ffffff;
                          text-decoration: none;
                          padding: 12px 24px;
                          border-radius: 5px;
                          font-weight: bold;
                          margin-top: 20px;
                          font-size: 18px;
                  }
                  .footer {
                          margin-top: 20px;
                          font-size: 14px;
                          color: #777;
                  }
                  .support {
                          margin-top: 10px;
                          font-size: 14px;
                          color: #333;
                  }
                  .support a {
                          color: #007bff;
                          text-decoration: none;
                          font-weight: bold;
                  }
          </style>
  </head>
  <body>
          <div class="container">
                  <div class="header">
                          <img src="https://res.cloudinary.com/mutari/image/upload/logo-with-name.png" alt="Mutari Logo">
                  </div>
                  <h3>Selamat Datang di Mutari, ${firstName}!</h3>
                  <p>Terima kasih telah mendaftar di Mutari. Kami sangat senang Anda bergabung dengan kami.</p>
                  <p>Jika Anda tidak mendaftar untuk akun Mutari, abaikan email ini.</p>
  
                  <div class="support">
                          <p>Butuh bantuan? Hubungi kami di <a href="mailto:support@mutari.id">support@mutari.id</a></p>
                  </div>
                  <div class="footer">
                          <p>© 2025 Mutari</p>
                  </div>
          </div>
  </body>
  </html>`
}
