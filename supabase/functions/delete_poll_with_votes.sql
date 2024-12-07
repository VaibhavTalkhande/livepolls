CREATE OR REPLACE FUNCTION delete_poll_with_votes(poll_id INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete votes first
    DELETE FROM user_votes WHERE question_id = poll_id;
    
    -- Then delete the poll
    DELETE FROM questions WHERE id = poll_id;
END;
$$;