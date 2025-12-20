import type { SettingDocument, SettingCategory, Lorebook } from '../utils/types';
import type { FileNode } from '../utils/tauri';
import { LorebookService } from './lorebookService';

/**
 * 设定集导入服务
 * 负责将文件系统目录结构转换为 SettingCategory 层次结构
 */
export class SettingImportService {
  /**
   * 将 FileNode 树转换为 SettingCategory 层次结构
   */
  static convertToSettingCategories(rootNode: FileNode): SettingCategory[] {
    if (!rootNode.children) {
      return [];
    }

    return rootNode.children
      .filter(node => node.is_dir)
      .map(dirNode => this.convertNodeToCategory(dirNode))
      .filter(cat => cat !== null) as SettingCategory[];
  }

  /**
   * 递归转换单个节点为 SettingCategory
   */
  private static convertNodeToCategory(node: FileNode): SettingCategory | null {
    if (!node.is_dir) {
      return null;
    }

    const documents: SettingDocument[] = [];
    const subcategories: SettingCategory[] = [];

    if (node.children) {
      for (const child of node.children) {
        if (child.is_dir) {
          // 递归处理子目录
          const subCat = this.convertNodeToCategory(child);
          if (subCat) {
            subcategories.push(subCat);
          }
        } else if (child.content) {
          // 转换文件为 SettingDocument
          const doc = this.convertFileToDocument(child);
          if (doc) {
            documents.push(doc);
          }
        }
      }
    }

    return {
      id: `category_${node.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: node.name,
      description: `${node.name} 相关设定`,
      documents,
      subcategories: subcategories.length > 0 ? subcategories : undefined,
    };
  }

  /**
   * 将文件节点转换为 SettingDocument
   */
  private static convertFileToDocument(node: FileNode): SettingDocument | null {
    if (!node.content) {
      return null;
    }

    const isMarkdown = node.name.endsWith('.md') || node.name.endsWith('.markdown');
    const title = node.name.replace(/\.(md|markdown|txt)$/i, '');

    return {
      title,
      content: node.content,
      format: isMarkdown ? 'markdown' : 'plaintext',
      category: '导入设定',
      tags: this.extractTagsFromContent(node.content),
      lastModified: new Date().toISOString(),
    };
  }

  /**
   * 从内容中提取标签（简单实现：提取 Markdown 标题或关键词）
   */
  private static extractTagsFromContent(content: string): string[] {
    const tags: string[] = [];

    // 提取 Markdown 一级标题
    const h1Matches = content.match(/^#\s+(.+)$/gm);
    if (h1Matches) {
      h1Matches.slice(0, 3).forEach(match => {
        const tag = match.replace(/^#\s+/, '').trim();
        if (tag.length > 0 && tag.length < 20) {
          tags.push(tag);
        }
      });
    }

    return tags;
  }

  /**
   * 收集所有文档（递归）
   */
  static collectAllDocuments(categories: SettingCategory[]): SettingDocument[] {
    const allDocs: SettingDocument[] = [];

    for (const category of categories) {
      allDocs.push(...category.documents);

      if (category.subcategories) {
        allDocs.push(...this.collectAllDocuments(category.subcategories));
      }
    }

    return allDocs;
  }

  /**
   * 将所有文档自动转换为 Lorebook 条目
   */
  static convertDocumentsToLorebook(
    documents: SettingDocument[],
    lorebookName: string
  ): Lorebook {
    const lorebook = LorebookService.createDefaultLorebook(
      `lorebook_${Date.now()}`,
      lorebookName
    );

    let insertionOrder = 100;

    for (const doc of documents) {
      // 按段落分割文档内容
      const paragraphs = doc.content
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 50);  // 过滤太短的段落

      for (const para of paragraphs.slice(0, 10)) {  // 每个文档最多10个段落
        // 提取关键词
        const keys = this.extractKeywordsFromParagraph(para);

        if (keys.length > 0) {
          const entry = LorebookService.createEntry(
            `${doc.title} - 片段`,
            keys,
            para.substring(0, 500)  // 限制长度
          );

          entry.insertionOrder = insertionOrder++;
          entry.memo = `来源: ${doc.title}`;

          lorebook.entries.push(entry);
        }
      }
    }

    return lorebook;
  }

  /**
   * 从段落中提取关键词
   */
  private static extractKeywordsFromParagraph(text: string): string[] {
    // 移除 Markdown 标记
    const cleanText = text
      .replace(/[#*_`\[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 分词（简单实现：按空格和标点分割）
    const words = cleanText
      .split(/[\s,，。.!！?？；;：:、]+/)
      .filter(w => w.length > 1 && w.length < 15);  // 过滤太短或太长的词

    // 取前5个词作为关键词
    const keywords = [...new Set(words.slice(0, 5))];  // 去重

    return keywords;
  }

  /**
   * 计算设定集总大小（字节）
   */
  static calculateTotalSize(documents: SettingDocument[]): number {
    return documents.reduce((sum, doc) => sum + doc.content.length, 0);
  }

  /**
   * 统计文件数量
   */
  static countFiles(rootNode: FileNode): number {
    let count = 0;

    if (!rootNode.is_dir) {
      return rootNode.content ? 1 : 0;
    }

    if (rootNode.children) {
      for (const child of rootNode.children) {
        count += this.countFiles(child);
      }
    }

    return count;
  }

  /**
   * 生成设定集摘要
   */
  static generateSummary(categories: SettingCategory[]): string {
    const allDocs = this.collectAllDocuments(categories);
    const totalSize = this.calculateTotalSize(allDocs);
    const fileCount = allDocs.length;

    const categoryNames = categories.map(c => c.name).join('、');

    return `包含 ${fileCount} 个文件，总计 ${(totalSize / 1024).toFixed(1)} KB。主要分类：${categoryNames}。`;
  }
}
