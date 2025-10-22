-- Create workout_history table to store workout session records
CREATE TABLE workout_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    program_id INT NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    completed_exercises JSON NOT NULL, -- Array of exercise indices that were completed
    total_exercises INT NOT NULL,
    duration_minutes INT NOT NULL, -- Calculated duration in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES training_programs(id) ON DELETE SET NULL,
    
    -- Indexes for better performance
    INDEX idx_user_id (user_id),
    INDEX idx_program_id (program_id),
    INDEX idx_start_time (start_time),
    INDEX idx_user_start_time (user_id, start_time)
);

-- Add some sample data (optional - remove if not needed)
INSERT INTO workout_history (user_id, program_id, program_name, start_time, end_time, completed_exercises, total_exercises, duration_minutes) VALUES
(1, 1, 'תוכנית כוח בסיסית', '2024-01-15 10:00:00', '2024-01-15 11:30:00', '[0, 1, 2, 3]', 5, 90),
(1, 2, 'תוכנית קרדיו', '2024-01-16 14:00:00', '2024-01-16 14:45:00', '[0, 1, 2]', 4, 45),
(1, 1, 'תוכנית כוח בסיסית', '2024-01-18 09:30:00', '2024-01-18 11:00:00', '[0, 1, 2, 3, 4]', 5, 90);


