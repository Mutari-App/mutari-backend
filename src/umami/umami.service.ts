import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SendUmamiDataToDiscordDTO } from './dto/send-umami-data-to-discord.dto'

@Injectable()
export class UmamiService {
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON)
  async getUmamiAnalytics() {
    const { startAt, endAt } = this._getPreviousMonthRange()

    try {
      const response = await fetch(
        `${process.env.UMAMI_URL}?startAt=${startAt}&endAt=${endAt}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-umami-api-key': process.env.UMAMI_API_KEY ?? '',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        await this.sendToDiscord(data)
      }
    } catch (error) {
      console.error(`Error: ${error.message}`)
    }
  }

  _getPreviousMonthRange() {
    const now = new Date()

    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    )

    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    return {
      startAt: firstDayOfLastMonth.getTime(),
      endAt: lastDayOfLastMonth.getTime(),
    }
  }

  async sendToDiscord(data: SendUmamiDataToDiscordDTO) {
    const MSG_CONTENT = {
      embeds: [
        {
          title: '📊 Umami Analytics Report',
          description:
            'Here are the website analytics for the selected period:',
          color: 5814783,
          fields: [
            {
              name: '📈 Stats',
              value:
                `- 👀 **Pageviews**: ${data.pageviews.value}\n` +
                `- 🧑‍💻 **Unique Visitors**: ${data.visitors.value}\n` +
                `- 🚀 **Visits**: ${data.visits.value}\n` +
                `- 💨 **Bounces**: ${data.bounces.value}\n` +
                `- ⏳ **Total Time Spent**: ${data.totaltime.value} seconds`,
              inline: false,
            },
          ],
          footer: {
            text: 'Data provided by Umami Analytics',
            icon_url: 'https://umami.is/logo.svg',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    }

    try {
      const webhookUrl = process.env.UMAMI_DISCORD_WEBHOOK_URL ?? ''
      if (!webhookUrl) {
        console.error('UMAMI_DISCORD_WEBHOOK_URL is not set')
        return
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(MSG_CONTENT),
      })
    } catch (error) {
      console.error(`Failed to send message to Discord: ${error.message}`)
    }
  }
}
