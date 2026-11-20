import {
  Body,
  Controller,
  Post,
  StandardSchemaValidationPipe,
  StreamableFile,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUserId } from "../../../common/decorators/current-user-id.decorator.js";
import { Roles } from "../../../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../../../common/guards/roles.guard.js";
import { buildRequestValidationException } from "../../../common/utils/build-request-validation-exception.js";
import { toApiBody } from "../../../common/utils/to-api-body.js";
import {
  generateCvSchema,
  type GenerateCvRequest,
} from "../requests/generate-cv.request.js";
import { CvGenerationService } from "../services/cv-generation.service.js";

@ApiTags("profile")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "A valid access token is required" })
@ApiForbiddenResponse({ description: "Forbidden: requires titulado role" })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("titulado")
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: buildRequestValidationException,
  }),
)
@Controller("profile/cv")
export class CvGenerateController {
  constructor(private readonly cvGenerationService: CvGenerationService) {}

  @Post("generate")
  @ApiBody(toApiBody(generateCvSchema))
  @ApiProduces("application/pdf")
  @ApiOkResponse({ description: "Generated CV PDF file" })
  @ApiNotFoundResponse({ description: "Profile not found for this user" })
  async generate(
    @CurrentUserId() userId: string,
    @Body({ schema: generateCvSchema }) request: GenerateCvRequest,
  ): Promise<StreamableFile> {
    const download = await this.cvGenerationService.generateCv(userId, request);
    return new StreamableFile(download.content, {
      type: download.mimeType,
      disposition: `attachment; filename="${download.fileName}"`,
      length: download.content.length,
    });
  }
}
