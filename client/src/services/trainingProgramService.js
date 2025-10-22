export const trainingProgramService = {
  async getTrainees(authenticatedFetch) {
    try {
      const response = await authenticatedFetch('/training-programs/trainees');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching trainees:', error);
      throw error;
    }
  },

  async getUserPrograms(authenticatedFetch, userId) {
    try {
      const response = await authenticatedFetch(`/training-programs/user/${userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user programs:', error);
      throw error;
    }
  },

  async getMyPrograms(authenticatedFetch) {
    try {
      const response = await authenticatedFetch('/training-programs/my-programs');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching my programs:', error);
      throw error;
    }
  },

  async create(authenticatedFetch, programData) {
    try {
      const response = await authenticatedFetch('/training-programs', {
        method: 'POST',
        body: JSON.stringify(programData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating training program:', error);
      throw error;
    }
  },

  async delete(authenticatedFetch, id) {
    try {
      const response = await authenticatedFetch(`/training-programs/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting training program:', error);
      throw error;
    }
  }
};