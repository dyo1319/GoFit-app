export const exerciseService = {
  async getAll(authenticatedFetch) {
    try {
      const response = await authenticatedFetch('/exercises');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }
  },

  async getLibrary(authenticatedFetch) {
    try {
      const response = await authenticatedFetch('/exercises/library');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching exercise library:', error);
      throw error;
    }
  },

  async getById(authenticatedFetch, id) {
    try {
      const response = await authenticatedFetch(`/exercises/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching exercise:', error);
      throw error;
    }
  },

  async create(authenticatedFetch, exerciseData) {
    try {
      const response = await authenticatedFetch('/exercises', {
        method: 'POST',
        body: JSON.stringify(exerciseData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating exercise:', error);
      throw error;
    }
  },

  async update(authenticatedFetch, id, exerciseData) {
    try {
      const response = await authenticatedFetch(`/exercises/${id}`, {
        method: 'PUT',
        body: JSON.stringify(exerciseData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  },

  async delete(authenticatedFetch, id) {
    try {
      const response = await authenticatedFetch(`/exercises/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  }
};