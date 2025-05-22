router.delete('/:photoId', checkToken, async (req, res) => {
  let connection;
  try {
    const { photoId } = req.params;
    const userId = req.user.userId;

    connection = await pool.getConnection();
    await connection.query('START TRANSACTION');

    const [photo] = await connection.query(
      `SELECT id, image_url, user_id FROM personal_photos WHERE id = ?`,
      [photoId]
    );

    if (!photo.length) {
      await connection.query('ROLLBACK');
      return res.status(404).json({ success: 0, message: 'Photo not found' });
    }

    // Only owner can delete
    if (photo[0].user_id !== userId) {
      await connection.query('ROLLBACK');
      return res.status(403).json({ success: 0, message: 'Not authorized to delete this photo' });
    }

    const filePath = path.join(__dirname, '../../', photo[0].image_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await connection.query(
      'DELETE FROM personal_photos WHERE id = ?',
      [photoId]
    );

    await connection.query('COMMIT');
    
    return res.json({ success: 1, message: 'Photo deleted successfully' });
  } catch (err) {
    if (connection) await connection.query('ROLLBACK');
    console.error('Error deleting photo:', err);
    return res.status(500).json({ success: 0, message: 'Failed to delete photo' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
