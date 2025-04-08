import { REMINDER_OPTION } from '@prisma/client'
const formatReminderOption = (reminderOption: REMINDER_OPTION): string => {
  switch (reminderOption) {
    case REMINDER_OPTION.ONE_DAY_BEFORE:
      return '1 hari'
    case REMINDER_OPTION.ONE_HOUR_BEFORE:
      return '1 jam'
    case REMINDER_OPTION.TEN_MINUTES_BEFORE:
      return '10 menit'
    default:
      return 'tidak diketahui'
  }
}

export const itineraryReminderTemplate = (
  firstName: string,
  tripName: string,
  reminderOption: REMINDER_OPTION
): string => {
  return `<!DOCTYPE html>
    <html>
    <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reminder for your Itinerary</title>
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
                    <h3>Halo, ${firstName}!</h3>
                    <p>Perjalanan anda <b>${tripName}</b> akan mulai dalam waktu ${formatReminderOption(reminderOption)}.</p>
    
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
