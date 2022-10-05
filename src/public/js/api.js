class Endpoints {
  static BASE_API = "http://localhost:8080/api/v1";
  static LOGIN = "/login";
  static USER = "/users/";
  static ALL_USERS = "/users/get/all";
  static GROUP = "/groups/";
  static USER_GROUPS = "/groups/user/";
  static MESSAGE = "/messages/";
  static ONLY_SEND = "/messages/new/chat";
  static USER_MESSAGES = "/messages/user/";
  static GROUP_MESSAGES = "/messages/group/";
  static CHAT = "/chat/";
  static CHATS = "/chats/";
}

const api = axios.create({ baseURL: Endpoints.BASE_API });

export { api, Endpoints };
