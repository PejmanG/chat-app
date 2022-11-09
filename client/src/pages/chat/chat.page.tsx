import {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
  useContext,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  VscArrowLeft,
  VscKebabVertical,
} from "react-icons/vsc";

import { WebSocketContext } from "../../context/websocket.context";

import UserCard, {
  IUser,
} from "../../components/user-card/user-card.component";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner.component";

function Chat() {
  const [currentRecipientUser, setCurrentRecipientUser] =
    useState<IUser | null>(null);
  const [messagesList, setMessagesList] = useState<
    JSX.Element[] | null
  >(null);
  const [message, setMessage] = useState("");
  const messagesListEnd = useRef<null | HTMLDivElement>(
    null
  );

  const socket = useContext(WebSocketContext);

  const params = useParams();

  // Join emit
  useEffect(() => {
    if (params.chatID && socket) {
      socket.emit("joined-chat", { chatId: params.chatID });
    }
  }, [params.chatID, socket]);

  useEffect(() => {
    if (!socket || !params.chatID) return;

    socket.on(
      `chat-${params.chatID}-init`,
      ({ recipientUser, messages }) => {
        setCurrentRecipientUser(recipientUser);
        setMessagesList(messages);
      }
    );

    socket.on(
      `chat-${params.chatID}-error`,
      ({ status, errorMessasge }) => {
        console.log(status);
        console.log(errorMessasge);
      }
    );

    return () => {
      socket.off(`chat-${params.chatID}-init`);
      socket.off(`chat-${params.chatID}-error`);
      socket.emit("left-chat", { chatId: params.chatID });
    };
  }, [socket, params.chatID]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setMessage(event.target.value);
  };
  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
  };

  const scrollToBottom = () => {
    messagesListEnd.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesList]);

  if (!messagesList || !currentRecipientUser) {
    return (
      <div className="py-80 text-3xl">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full bg-neutral-900">
      {/* Header */}
      <div className="p-3 bg-neutral-800 border-b sm:border-l border-neutral-100 dark:border-neutral-500">
        <header className="flex justify-between items-center text-lg">
          {/* The menu */}
          <Link to={"/"} className="p-2 pl-0">
            <VscArrowLeft />
          </Link>
          {/* Connection status and search bar toggle*/}
          <div className="flex-1">
            <UserCard user={currentRecipientUser} />
          </div>
          <button className="p-2 pr-0" type="button">
            <VscKebabVertical />
          </button>
        </header>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {messagesList.map((Tag, i) => (
          <div className="bg-neutral-600 my-2 px-7" key={i}>
            {Tag}
          </div>
        ))}
        <div className="h-1" ref={messagesListEnd} />
      </div>

      {/* Text input */}
      <div>
        <form onSubmit={handleSubmit} className="flex">
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <input
            className="bg-neutral-800 w-full h-12 px-4 focus:outline-none"
            name="message"
            id="message"
            autoComplete="off"
            autoFocus
            value={message}
            onKeyDown={(event) => {
              if (
                event.nativeEvent.code === "Enter" &&
                event.shiftKey
              ) {
                // TODO - Send message
              }
            }}
            onChange={handleChange}
          />
          <button
            type="submit"
            className="bg-green-700 h-12 w-1/6 hover:cursor-pointer"
            // onClick={sendMessage}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
