import { api, Endpoints } from "./api.js";
import { v4 as uuid } from "https://jspm.dev/uuid";
const { createApp } = Vue;

createApp({
  data() {
    return {
      sideMenuIcons: [
        {
          path: "/public/assets/chat-user.svg",
          description: "User chat icon",
          active: true,
        },
        {
          path: "/public/assets/chat-group.svg",
          description: "Group chat icon",
          active: false,
        },
      ],
      user: {},
      selectedChat: {},
      users: [],
      chats: [],
      groups: [],
      messages: [],
      socket: io(),
      toggleProfile: false,
      toggleAddChat: false,
      toggleAddGroup: false,
      filterTerm: "",
      newMessage: "",
      newMessageImage: "",
      newGroup: {
        name: "",
        admin: "",
        image: "",
        participants: [],
      },
    };
  },
  methods: {
    logout() {
      sessionStorage.removeItem("user");
      window.location.href = "/login";
    },
    toggleAside(variable) {
      if (variable === "profile") this.toggleProfile = !this.toggleProfile;

      if (variable === "add-chat") {
        this.toggleAddChat = !this.toggleAddChat;
        this.filterTerm = "";
        this.getAllUsers();
      }

      if (variable === "add-group") {
        this.toggleAddGroup = !this.toggleAddGroup;
        this.filterTerm = "";
        this.newGroup.name = "";
        this.newGroup.admin = "";
        this.newGroup.image = "";
        this.newGroup.participants = [];
        this.getAllUsers();
      }
    },
    getAvatar(event) {
      const image = event.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(image);

      reader.onloadend = async () => {
        try {
          const body = { ...this.user, avatar: reader.result };
          await api.put(Endpoints.USER, body);

          this.user.avatar = reader.result;
          sessionStorage.user = JSON.stringify(this.user);
        } catch (error) {
          console.log(error.response.data);
        }
      };
    },
    setActiveChatType(index) {
      this.sideMenuIcons.forEach((icon) => {
        this.sideMenuIcons.indexOf(icon) !== index
          ? (icon.active = false)
          : (icon.active = true);
      });
    },
    getTimestampAsDate(timestamp) {
      const day = parseInt(timestamp.substring(0, 2));
      const month = parseInt(timestamp.substring(3, 5));
      const year = parseInt(timestamp.substring(6, 10));
      const hour = parseInt(timestamp.substring(12, 14));
      const minute = parseInt(timestamp.substring(15, 17));
      const second = parseInt(timestamp.substring(18, 20));

      return new Date(year, month, day, hour, minute, second);
    },
    setSelectedChat(type, id) {
      if (type === "user") {
        this.selectedChat = this.chats.find((chat) => chat.id === id);
      } else {
        this.selectedChat = this.groups.find((group) => group.id === id);
      }

      if (localStorage.getItem(`caseiroZap-${this.user.username}`)) {
        localStorage.removeItem(`caseiroZap-${this.user.username}`);
      }

      localStorage.setItem(
        `caseiroZap-${this.user.username}`,
        JSON.stringify([this.selectedChat])
      );
    },
    async getAllUsers() {
      try {
        const response = await api.get(Endpoints.ALL_USERS);

        this.users = response.data.filter(
          (user) =>
            user.username !== this.user.username &&
            !this.chats.find((chat) => chat.receiver === user.username)
        );
      } catch (error) {
        this.users = [];
      }
    },
    addParticipant(chat) {
      if (!this.newGroup.participants.includes(chat.receiver)) {
        this.newGroup.participants.push(chat.receiver);
      } else {
        const index = this.newGroup.participants.indexOf(chat.receiver);
        this.newGroup.participants.splice(index, 1);
      }
    },
    getGroupImage(event) {
      const image = event.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(image);

      reader.onloadend = () => {
        this.newGroup.image = reader.result;
      };
    },
    async getMessageImage(event) {
      this.newMessageImage = await new Promise((resolve) => {
        const image = event.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(image);

        reader.onload = () => {
          resolve(reader.result);
        };
      });

      this.newMessage = "Picture loaded...";
    },
    async sendMessage(chat) {
      const message =
        this.newMessageImage !== "" ? this.newMessageImage : this.newMessage;

      this.newMessage = "";
      this.newMessageImage = "";

      const body = {
        id: uuid(),
        sender: this.user.username,
        receiver: chat.receiver ? chat.receiver : chat.id,
        content: message,
        timestamp: new Date().toLocaleString(),
        type: chat.receiver ? "user" : "group",
      };

      if (chat.owner) {
        this.chats.forEach((current) => {
          if (current.id === chat.id) {
            current.messages.push(body);
          }
        });
      } else {
        this.groups.forEach((current) => {
          if (current.id === chat.id) {
            current.messages.push(body);
          }
        });
      }

      try {
        await api.post(Endpoints.MESSAGE, body);
      } catch (error) {
        console.log(error);
      }
    },
    async getAllMessages() {
      setTimeout(async () => {
        try {
          const response = await api.get(
            Endpoints.USER_MESSAGES + this.user.username
          );

          this.messages = response.data;
        } catch (error) {
          console.log(error.response.data);
          this.messages = [];
        }
      }, 500);
    },
    async getChats() {
      setTimeout(async () => {
        try {
          const response = await api.get(Endpoints.CHATS + this.user.username);
          this.chats = response.data;

          this.chats.forEach((chat) => {
            chat.messages = [];
            chat.type = "chat";
          });

          this.setChatMessages();
        } catch (error) {
          console.log(error.response.data);
          this.chats = [];
        }
      }, 500);
    },
    async getGroups() {
      setTimeout(async () => {
        try {
          const response = await api.get(
            Endpoints.USER_GROUPS + this.user.username
          );

          this.groups = response.data;

          this.groups.forEach((group) => {
            group.messages = [];
            group.type = "group";
          });

          this.setGroupMessages();
        } catch (error) {
          console.log(error.response.data);
          this.groups = [];
        }
      }, 500);
    },
    setChatMessages() {
      this.chats.forEach((chat) => {
        let messages = this.messages.filter(
          (message) => message.type === "user"
        );

        let chatMessages = messages.filter((message) => {
          return (
            message.receiver === chat.receiver ||
            message.sender === chat.receiver
          );
        });

        if (chatMessages) {
          chat.messages = chatMessages;
        }
      });
    },
    setGroupMessages() {
      this.groups.forEach((group) => {
        let messages = this.messages.filter(
          (message) =>
            message.receiver === group.id &&
            !group.messages.includes(message) &&
            message.type === "group"
        );

        if (messages) {
          group.messages = messages;
        }
      });
    },
    async createChat(user) {
      try {
        const body = {
          owner: this.user.username,
          receiver: user.username,
          avatar: user.avatar,
        };

        this.toggleAddChat = false;
        await api.post(Endpoints.CHATS, body);
      } catch (error) {
        console.log(error.response);
      }
    },
    async notifyReceiver(user) {
      const body = {
        id: uuid(),
        sender: this.user.username,
        receiver: user.username,
        content: "new-chat",
        timestamp: new Date().toLocaleString(),
        type: "user",
      };

      try {
        await api.post(Endpoints.ONLY_SEND, body);
      } catch (error) {
        console.log(error.response);
      }
    },
    async notifyAdmin() {
      const body = {
        id: uuid(),
        sender: this.user.username,
        receiver: this.newGroup.admin,
        content: this.newGroup,
        timestamp: new Date().toLocaleString(),
        type: "group",
      };

      try {
        await api.post(Endpoints.ONLY_SEND, body);
      } catch (error) {
        console.log(error.response);
      }
    },
    async notifyParticipants() {
      this.newGroup.participants.forEach(async (participant) => {
        const body = {
          id: uuid(),
          sender: this.user.username,
          receiver: participant,
          content: this.newGroup,
          timestamp: new Date().toLocaleString(),
          type: "group",
        };

        try {
          await api.post(Endpoints.ONLY_SEND, body);
        } catch (error) {
          console.log(error.response);
        }
      });

      this.newGroup = {
        name: "",
        admin: "",
        image: "",
        participants: [],
      };
    },
    async createGroup() {
      this.newGroup.admin = this.user.username;

      try {
        this.toggleAddGroup = false;

        await api.post(Endpoints.GROUP, this.newGroup);
      } catch (error) {
        console.log(error);
      }
    },
  },
  async mounted() {
    this.socket.emit("listen", this.user.username);

    this.socket.on("message", async (message) => {
      if (message.sender !== this.user.username) {
        console.log(message);

        try {
          const response = await api.get(Endpoints.MESSAGE + message.id);

          if (!response.data.received) {
            await api.put(Endpoints.MESSAGE + message.id);
          }
        } catch (error) {
          console.log(error);
        }

        message.received = true;

        if (!this.selectedChat) {
          await Promise.all([
            this.getAllMessages(),
            this.getChats(),
            this.getGroups(),
          ]);
        } else {
          if (
            this.selectedChat.receiver === message.receiver ||
            this.selectedChat.id === message.receiver
          ) {
            this.selectedChat.messages.push(message);
          } else {
            await this.getAllMessages();
            await this.getChats();
            await this.getGroups();
          }
        }
      }
    });

    this.socket.on("new-chat", async (message) => {
      console.log(message);

      await Promise.all([
        this.createChat(message),
        this.getChats(),
        this.getAllMessages(),
      ]);

      this.setChatMessages();
    });

    this.socket.on("new-group", async (message) => {
      console.log(message);

      await Promise.all([this.getAllMessages(), this.getGroups()]);

      this.setGroupMessages();
    });
  },
  async created() {
    if (!sessionStorage.user) window.location.href = "/login";

    this.user = JSON.parse(sessionStorage.user);

    await Promise.all([
      this.getAllMessages(),
      this.getChats(),
      this.getGroups(),
    ]);

    if (localStorage.getItem(`caseiroZap-${this.user.username}`)) {
      const lastSessionContent = JSON.parse(
        localStorage.getItem(`caseiroZap-${this.user.username}`)
      );

      const localChat = lastSessionContent.find((object) =>
        Object.hasOwn(object, "messages")
      );

      if (localChat && Object.hasOwn(localChat, "owner")) {
        this.selectedChat = this.chats.find((chat) => chat.id === localChat.id);
        this.sideMenuIcons[0].active = true;
      } else {
        this.selectedChat = this.groups.find(
          (group) => group.id === localChat.id
        );
        this.sideMenuIcons[1].active = true;
        this.sideMenuIcons[0].active = false;
      }
    }
  },
  computed: {
    filteredUsers() {
      return this.users.filter((user) => {
        return user.username.match(this.filterTerm);
      });
    },
    filteredChats() {
      return this.chats.filter((chat) => {
        return chat.receiver.match(this.filterTerm);
      });
    },
  },
}).mount("#app");
