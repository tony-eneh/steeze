import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getMe(@CurrentUser() user: any) {
    const userData = await this.usersService.findById(user.sub);
    return {
      success: true,
      data: userData,
      message: 'User profile retrieved successfully',
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMe(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userData = await this.usersService.updateProfile(
      user.sub,
      updateUserDto,
    );
    return {
      success: true,
      data: userData,
      message: 'Profile updated successfully',
    };
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Get public profile' })
  @ApiResponse({ status: 200, description: 'Public profile retrieved' })
  async getPublicProfile(@Param('id') id: string) {
    const userData = await this.usersService.findPublicProfile(id);
    return {
      success: true,
      data: userData,
      message: 'Public profile retrieved successfully',
    };
  }

  // Address Management
  @Get('me/addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List own addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved' })
  async getAddresses(@CurrentUser() user: any) {
    const addresses = await this.usersService.getAddresses(user.sub);
    return {
      success: true,
      data: addresses,
      message: 'Addresses retrieved successfully',
    };
  }

  @Post('me/addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new address' })
  @ApiResponse({ status: 201, description: 'Address created' })
  async createAddress(
    @CurrentUser() user: any,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    const address = await this.usersService.createAddress(
      user.sub,
      createAddressDto,
    );
    return {
      success: true,
      data: address,
      message: 'Address created successfully',
    };
  }

  @Patch('me/addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an address' })
  @ApiResponse({ status: 200, description: 'Address updated' })
  async updateAddress(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    const address = await this.usersService.updateAddress(
      user.sub,
      id,
      updateAddressDto,
    );
    return {
      success: true,
      data: address,
      message: 'Address updated successfully',
    };
  }

  @Delete('me/addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  async deleteAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.sub, id);
  }
}
