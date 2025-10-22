export const initialUserForm = {
  username: "",
  phone: "",
  password: "",
  birth_date: "",
  role: "trainee",
  gender: "male",
  access_profile: "default",
  permissions_json: [],
  weight: "",
  height: "",
  body_fat: "",
  muscle_mass: "",
  circumference: "",
  recorded_at: "",
  start_date: "",
  end_date: "",
  payment_status: "pending"
};

export const initialExerciseForm = {
  exercise_name: "",
  category: "",
  description: "",
  muscle_group: "",
  difficulty: "",
  equipment: "",
  video_url: ""
};

export const initialTrainingProgramForm = {
  program_name: "",
  user_id: "",
  exercises: [
    {
      exercise_id: "",
      sets: "",
      reps: "",
      duration: 0
    }
  ]
};