import { Test, TestingModule } from '@nestjs/testing'
import { MapController } from './map.controller'
import { MapService } from './map.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { HttpException, HttpStatus } from '@nestjs/common'

describe('MapController', () => {
  let mapController: MapController
  let mapService: MapService
  let responseUtil: ResponseUtil

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MapController],
      providers: [
        {
          provide: MapService,
          useValue: { getPlaceDetails: jest.fn() },
        },
        {
          provide: ResponseUtil,
          useValue: { response: jest.fn() },
        },
      ],
    }).compile()

    mapController = module.get<MapController>(MapController)
    mapService = module.get<MapService>(MapService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  it('should return place details when placeId is valid', async () => {
    const mockDetails = { name: 'Test Place' }
    jest.spyOn(mapService, 'getPlaceDetails').mockResolvedValue(mockDetails)
    jest
      .spyOn(responseUtil, 'response')
      .mockImplementation((meta, data) => ({ ...meta, ...data }))

    const result = await mapController.getPlaceDetails('validPlaceId')

    expect(mapService.getPlaceDetails).toHaveBeenCalledWith('validPlaceId')
    expect(responseUtil.response).toHaveBeenCalledWith(
      {
        statusCode: HttpStatus.OK,
        message: 'Place details fetched successfully.',
      },
      { details: mockDetails }
    )
    expect(result).toEqual({
      statusCode: 200,
      message: 'Place details fetched successfully.',
      details: mockDetails,
    })
  })

  it('should throw an error if placeId is not provided', async () => {
    jest
      .spyOn(mapService, 'getPlaceDetails')
      .mockRejectedValue(
        new HttpException('Place ID is required', HttpStatus.BAD_REQUEST)
      )

    await expect(mapController.getPlaceDetails('')).rejects.toThrow(
      HttpException
    )
    expect(mapService.getPlaceDetails).toHaveBeenCalledWith('')
  })

  it('should handle service errors properly', async () => {
    jest
      .spyOn(mapService, 'getPlaceDetails')
      .mockRejectedValue(
        new HttpException(
          'Failed to fetch data',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      )

    await expect(
      mapController.getPlaceDetails('invalidPlaceId')
    ).rejects.toThrow(HttpException)
    expect(mapService.getPlaceDetails).toHaveBeenCalledWith('invalidPlaceId')
  })
})
