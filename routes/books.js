import express from 'express';
import db from '../db/index.js';
import axios from 'axios';

const router = express.Router();

// Get all books
router.get('/', async (req, res) => {
  try {
    const sort = req.query.sort || 'date_read';
    const validSorts = ['title', 'rating', 'date_read'];
    const sortBy = validSorts.includes(sort) ? sort : 'date_read';

    // Use parameterized identifier safely by mapping to actual SQL column names
    const sortColumns = {
      title: 'title',
      rating: 'rating',
      date_read: 'date_read',
    };

    const sortColumn = sortColumns[sortBy];

    const result = await db.query(`SELECT * FROM books ORDER BY ${sortColumn} DESC`);
    res.render('index', { books: result.rows, sortBy });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).send('Server Error');
  }
});

// Show form
router.get('/add', (req, res) => {
  res.render('add');
});

// Add book
router.post('/add', async (req, res) => {
  const { title, author, date_read, rating, notes } = req.body;

  let coverId = null;

  try {
    // Fetch book data from Open Library
    const response = await axios.get(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`);

    const docs = response.data.docs;
    if (docs && docs.length > 0 && docs[0].cover_i) {
      coverId = docs[0].cover_i;
    }

    // Insert into DB
    await db.query(
      'INSERT INTO books (title, author, date_read, rating, notes, cover_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [title, author, date_read, rating, notes, coverId]
    );

    req.flash('success_msg', 'Book added successfully!');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding book.');
    res.redirect('/');
  }
});


// Delete book
router.post('/delete/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.redirect('/');
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).send('Failed to delete book');
  }
});

// Show Edit Form
router.get('/edit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.render('edit', { book: result.rows[0] });
  } catch (error) {
    console.error('Error fetching book for edit:', error);
    res.status(500).send('Server error');
  }
});

// Handle Edit Submission
router.post('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, date_read, rating, notes } = req.body;

  try {
    // Optional: fetch new cover_id if title changed
    let cover_id = null;
    const response = await axios.get("https://openlibrary.org/search.json?title=${encodeURIComponent(title)}");
    if (response.data.docs.length > 0) {
      cover_id = response.data.docs[0].cover_i;
    }

    await db.query(
      `UPDATE books
       SET title = $1,
           author = $2,
           date_read = $3,
           rating = $4,
           notes = $5,
           cover_id = $6
       WHERE id = $7`,
      [title, author, date_read, rating, notes, cover_id, id]
    );

    req.flash('success_msg', 'Book updated successfully!');
    res.redirect('/');
  } catch (error) {
    console.error('Error updating book:', error);
    req.flash('error_msg', 'Failed to update book');
    res.status(500).send('Failed to update book');
  }
});

export default router;