-- Create a function to handle verse insertion with proper JSONB casting
CREATE OR REPLACE FUNCTION insert_saved_verse(
  p_user_id uuid,
  p_book_name text,
  p_chapter_number integer,
  p_verse_selections jsonb,
  p_verse_text text,
  p_display_reference text,
  p_is_composite boolean
) RETURNS user_saved_verses AS $$
DECLARE
  v_result user_saved_verses;
BEGIN
  INSERT INTO user_saved_verses (
    user_id,
    book_name,
    chapter_number,
    verse_selections,
    verse_text,
    display_reference,
    is_composite,
    themes
  ) VALUES (
    p_user_id,
    p_book_name,
    p_chapter_number,
    p_verse_selections,
    p_verse_text,
    p_display_reference,
    p_is_composite,
    '{}'::text[]
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 