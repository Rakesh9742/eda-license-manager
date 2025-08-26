import { watch } from 'fs';
import { readdir, readFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class FileWatcher extends EventEmitter {
  constructor(filesDir = null) {
    super();
    // Use absolute path to files directory
    this.filesDir = filesDir || join(__dirname, '..', 'files');
    this.watcher = null;
    this.vendorFiles = new Map(); // Track current files for each vendor
  }

  async initialize() {
    try {
      // Ensure files directory exists
      await this.scanExistingFiles();
      
      // Start watching the directory
      this.startWatching();
      
      console.log('📁 File watcher initialized for:', this.filesDir);
    } catch (error) {
      console.error('❌ Error initializing file watcher:', error);
    }
  }

  async scanExistingFiles() {
    try {
      console.log(`🔍 Scanning directory: ${this.filesDir}`);
      const files = await readdir(this.filesDir);
      console.log(`📁 Found ${files.length} files in directory:`, files);
      
      for (const file of files) {
        const vendor = this.getVendorFromFilename(file);
        if (vendor) {
          this.vendorFiles.set(vendor, file);
          console.log(`📄 Found existing file for ${vendor}: ${file}`);
        } else {
          console.log(`⚠️ File ${file} not recognized as vendor file`);
        }
      }
      
      console.log(`✅ File scan complete. Vendor files found:`, Object.fromEntries(this.vendorFiles));
    } catch (error) {
      console.error('❌ Error scanning existing files:', error);
      throw error; // Re-throw to handle in initialization
    }
  }

  startWatching() {
    try {
      this.watcher = watch(this.filesDir, { recursive: false }, async (eventType, filename) => {
        if (!filename) return;

        console.log(`📁 File event: ${eventType} - ${filename}`);
        
        if (eventType === 'rename' || eventType === 'change') {
          await this.handleFileChange(filename);
        }
      });

      console.log('👀 File watcher started');
    } catch (error) {
      console.error('❌ Error starting file watcher:', error);
    }
  }

  async handleFileChange(filename) {
    try {
      const vendor = this.getVendorFromFilename(filename);
      if (!vendor) return;

      const filePath = join(this.filesDir, filename);
      
      // Check if file exists (might be a delete event)
      try {
        await readFile(filePath, 'utf8');
        
        // New or updated file
        const oldFile = this.vendorFiles.get(vendor);
        if (oldFile && oldFile !== filename) {
          // Delete old file
          try {
            await unlink(join(this.filesDir, oldFile));
            console.log(`🗑️ Deleted old file: ${oldFile}`);
          } catch (error) {
            console.warn(`⚠️ Could not delete old file ${oldFile}:`, error.message);
          }
        }
        
        this.vendorFiles.set(vendor, filename);
        console.log(`✅ Updated ${vendor} file to: ${filename}`);
        
        // Emit event for license service
        this.emit('fileUpdated', { vendor, filename });
        
      } catch (error) {
        // File was deleted
        if (this.vendorFiles.get(vendor) === filename) {
          this.vendorFiles.delete(vendor);
          console.log(`🗑️ Removed ${vendor} file: ${filename}`);
          this.emit('fileDeleted', { vendor, filename });
        }
      }
    } catch (error) {
      console.error('❌ Error handling file change:', error);
    }
  }

  getVendorFromFilename(filename) {
    const lowerFilename = filename.toLowerCase();
    
    if (lowerFilename.includes('cadence')) return 'cadence';
    if (lowerFilename.includes('synopsys')) return 'synopsys';
    if (lowerFilename.includes('mgs') || lowerFilename.includes('mentor') || lowerFilename.includes('siemens')) return 'mgs';
    
    // Direct filename matching
    if (lowerFilename === 'cadence') return 'cadence';
    if (lowerFilename === 'synopsys') return 'synopsys';
    if (lowerFilename === 'mgs') return 'mgs';
    
    return null;
  }

  getCurrentFiles() {
    return Object.fromEntries(this.vendorFiles);
  }

  async readVendorFile(vendor) {
    try {
      console.log(`🔍 Looking for file for vendor: ${vendor}`);
      console.log(`📁 Current vendor files:`, Object.fromEntries(this.vendorFiles));
      
      const filename = this.vendorFiles.get(vendor);
      if (!filename) {
        console.error(`❌ No file found for vendor: ${vendor}`);
        console.log(`📁 Available vendors:`, Array.from(this.vendorFiles.keys()));
        throw new Error(`No file found for vendor: ${vendor}`);
      }

      const filePath = join(this.filesDir, filename);
      console.log(`📂 Reading file from path: ${filePath}`);
      
      const content = await readFile(filePath, 'utf8');
      
      console.log(`📖 Successfully read file for ${vendor}: ${filename} (${content.length} characters)`);
      return content;
    } catch (error) {
      console.error(`❌ Error reading file for ${vendor}:`, error.message);
      throw error;
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('🛑 File watcher stopped');
    }
  }
}

export const fileWatcher = new FileWatcher();
