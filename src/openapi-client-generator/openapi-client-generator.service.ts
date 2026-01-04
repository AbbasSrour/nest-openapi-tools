import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';

export interface OpenApiClientGeneratorOptions {
  enabled: boolean;
  type: string;
  openApiToolsFilePath?: string;
  openApiFilePath: string;
  outputFolderPath: string;
  additionalProperties?: string;
  globalProperty?: string;
  skipValidation?: boolean;
}

@Injectable()
export class OpenApiClientGeneratorService {
  private readonly logger = new Logger(OpenApiClientGeneratorService.name);

  private async checkCliAvailability(): Promise<boolean> {
    return new Promise(resolve => {
      const checkCmd = spawn('which', ['openapi-generator-cli'], {
        shell: true,
      });

      checkCmd.on('exit', code => {
        resolve(code === 0);
      });

      checkCmd.on('error', () => {
        resolve(false);
      });
    });
  }

  async generateClient(options: OpenApiClientGeneratorOptions) {
    if (!options.outputFolderPath?.length) {
      throw new Error('Client output directory was not set.');
    }

    const isCliAvailable = await this.checkCliAvailability();

    if (!isCliAvailable) {
      this.logger.warn(
        'openapi-generator-cli is not installed. Please install it globally with: npm install -g @openapitools/openapi-generator-cli',
      );
      throw new Error(
        'openapi-generator-cli is not available. Please install @openapitools/openapi-generator-cli globally.',
      );
    }

    await new Promise((resolve, reject) => {
      const command = [
        `openapi-generator-cli`,
        options?.openApiToolsFilePath
          ? `--openapitools=${options.openApiToolsFilePath}`
          : '',
        `generate`,
        `-g ${options.type}`,
        `-i \"${options.openApiFilePath}\"`,
        `-o \"${options.outputFolderPath}\"`,
        options?.additionalProperties?.length
          ? `--additional-properties=\"${options.additionalProperties}\"`
          : '',
        options?.globalProperty?.length
          ? `--global-property=\"${options.globalProperty}\"`
          : '',
        options?.skipValidation ? `--skip-validate-spec` : '',
      ].join(' ');

      const cmd = spawn(command, { stdio: 'inherit', shell: true });
      cmd.on('error', () =>
        reject(`Error running openapi-generator-cli command.`),
      );
      cmd.on('exit', resolve);
    });
  }
}
