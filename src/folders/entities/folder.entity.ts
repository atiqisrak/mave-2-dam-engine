import { ApiProperty } from '@nestjs/swagger';

export class Folder {
  @ApiProperty({ description: 'Folder ID' })
  id: string;

  @ApiProperty({ description: 'Folder name' })
  name: string;

  @ApiProperty({ description: 'Folder description', required: false })
  description?: string;

  @ApiProperty({ description: 'Full folder path' })
  path: string;

  @ApiProperty({ description: 'Parent folder ID', required: false })
  parentId?: string;

  @ApiProperty({ description: 'Folder owner ID' })
  ownerId: string;

  @ApiProperty({ description: 'Whether the folder is public' })
  isPublic: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Child folders', required: false })
  children?: Folder[];

  @ApiProperty({ description: 'Media count in folder', required: false })
  mediaCount?: number;

  @ApiProperty({ description: 'Subfolder count in folder', required: false })
  folderCount?: number;
}
