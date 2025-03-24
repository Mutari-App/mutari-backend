import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

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
}
