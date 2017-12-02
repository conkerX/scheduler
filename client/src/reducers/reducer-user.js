const users = (state = null, action) => {
  switch (action.type) {
    case 'GET_ALL':
      return action.payload.data.user || state;
    default:
      return state;
  }
};

export default users;