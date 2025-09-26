#!/usr/bin/env node

/**
 * Script to verify all collections are properly populated
 */

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables
dotenv.config({ path: './server/.env' });

const URI = process.env.DATABASE_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'library';

async function verifyDatabase() {
    console.log('🔗 Connecting to MongoDB...');
    
    const client = new MongoClient(URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    
    // Check all collections
    const collections = ['books', 'authors', 'users', 'reviews', 'issueDetails'];
    
    console.log('📊 Database Collection Summary:');
    console.log('================================');
    
    for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`📁 ${collectionName.padEnd(12)}: ${count} documents`);
        
        if (count > 0) {
            const sample = await collection.findOne({});
            if (collectionName === 'books') {
                console.log(`   Sample: "${sample.title}" by ${sample.authors?.[0]?.name || 'Unknown'}`);
            } else if (collectionName === 'authors') {
                console.log(`   Sample: ${sample.name} (${sample.books?.length || 0} books)`);
            } else if (collectionName === 'users') {
                console.log(`   Sample: ${sample.name} (Admin: ${sample.isAdmin})`);
            } else if (collectionName === 'reviews') {
                console.log(`   Sample: ${sample.rating}⭐ review by ${sample.name}`);
            } else if (collectionName === 'issueDetails') {
                console.log(`   Sample: ${sample.recordType} for ${sample.book?.title || 'Unknown book'}`);
            }
        }
        console.log('');
    }
    
    // Verify data relationships
    console.log('🔗 Data Relationship Verification:');
    console.log('==================================');
    
    const booksCollection = db.collection('books');
    const authorsCollection = db.collection('authors');
    
    const books = await booksCollection.find({}).toArray();
    const authors = await authorsCollection.find({}).toArray();
    
    console.log(`📚 Books with proper author format: ${books.filter(book => 
        book.authors && Array.isArray(book.authors) && 
        book.authors[0] && typeof book.authors[0] === 'object' && 
        book.authors[0]._id && book.authors[0].name
    ).length}/${books.length}`);
    
    console.log(`👤 Authors with linked books: ${authors.filter(author => 
        author.books && Array.isArray(author.books) && author.books.length > 0
    ).length}/${authors.length}`);
    
    await client.close();
    console.log('\n🔚 MongoDB connection closed');
}

// Run the script
try {
    await verifyDatabase();
    console.log('\n🎉 Database verification completed successfully!');
} catch (error) {
    console.error('❌ Error verifying database:', error);
    process.exit(1);
}
