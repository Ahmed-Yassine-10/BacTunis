import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Inscription d\'un nouvel élève' })
    @ApiResponse({ status: 201, description: 'Inscription réussie' })
    @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Connexion d\'un élève' })
    @ApiResponse({ status: 200, description: 'Connexion réussie' })
    @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
    @ApiResponse({ status: 200, description: 'Token rafraîchi' })
    @ApiResponse({ status: 401, description: 'Token invalide' })
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto.refreshToken);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Déconnexion' })
    async logout(@Body() dto: RefreshTokenDto) {
        await this.authService.logout(dto.refreshToken);
        return { message: 'Déconnexion réussie' };
    }
}
