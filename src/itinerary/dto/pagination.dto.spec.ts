import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { PaginationDto } from './pagination.dto'

describe('PaginationDto', () => {
  it('should transform page to a number', async () => {
    const dto = plainToInstance(PaginationDto, { page: '5' }) // Simulasi input string
    expect(dto.page).toBe(5) // Harus dikonversi jadi number
  })

  it('should return validation error if page is negative', async () => {
    const dto = plainToInstance(PaginationDto, { page: '-3' })
    const errors = await validate(dto)

    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].constraints).toHaveProperty('isPositive') // Karena harus positif
  })

  it('should allow page to be optional', async () => {
    const dto = plainToInstance(PaginationDto, {}) // Tidak ada page
    const errors = await validate(dto)

    expect(errors.length).toBe(0) // Harus valid karena optional
    expect(dto.page).toBeUndefined()
  })
})
