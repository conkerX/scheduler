const view = (state = 'login', action) => {
	switch(action.type) {
    case 'CHANGE_VIEW':
      return action.view;
    case 'GET_ALL':
      return action.payload.data.view || state;
    case 'REMOVE_LOGGED_IN_DETAILS':
      return 'login';
    default:
      return state;
  }
};

export default view;
