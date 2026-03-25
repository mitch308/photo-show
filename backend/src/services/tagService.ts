import { AppDataSource } from '../config/database.js';
import { Tag } from '../models/Tag.js';
import { Not, Like } from 'typeorm';

export interface CreateTagData {
  name: string;
}

export class TagService {
  private tagRepo = AppDataSource.getRepository(Tag);

  async createTag(data: CreateTagData): Promise<Tag> {
    // Check for duplicate per D-15
    const existing = await this.tagRepo.findOne({ where: { name: data.name } });
    if (existing) {
      throw new Error('Tag already exists');
    }

    const tag = this.tagRepo.create({ name: data.name });
    return this.tagRepo.save(tag);
  }

  async getTags(): Promise<Tag[]> {
    return this.tagRepo.find({
      relations: ['works'],
      order: { name: 'ASC' },
    });
  }

  async getTagById(id: string): Promise<Tag | null> {
    return this.tagRepo.findOne({
      where: { id },
      relations: ['works'],
    });
  }

  async updateTag(id: string, name: string): Promise<Tag | null> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) return null;

    // Check for duplicate
    const existing = await this.tagRepo.findOne({ 
      where: { name, id: Not(id) } 
    });
    if (existing) {
      throw new Error('Tag name already exists');
    }

    tag.name = name;
    return this.tagRepo.save(tag);
  }

  async deleteTag(id: string): Promise<boolean> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) return false;

    await this.tagRepo.remove(tag);
    return true;
  }

  async searchTags(query: string): Promise<Tag[]> {
    return this.tagRepo.find({
      where: { name: Like(`%${query}%`) },
      order: { name: 'ASC' },
    });
  }
}

export const tagService = new TagService();