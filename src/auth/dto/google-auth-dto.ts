import { IsString } from 'class-validator'

export class GoogleAuthDTO {
  @IsString()
  firebaseToken: string
}
