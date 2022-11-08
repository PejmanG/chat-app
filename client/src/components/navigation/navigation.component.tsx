import {
  ChangeEvent,
  useState,
  useContext,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  VscSearch,
  VscClose,
  VscMenu,
  VscSignOut,
} from "react-icons/vsc";
import { toast } from "react-toastify";

import useUser from "../../hooks/useUser";

import { WebSocketContext } from "../../context/websocket.context";

import fetcher from "../../utils/fetcher";

import ChatCardsContainer from "../chat-cards-container/chat-cards-container.component";
import UserCardsContainer from "../user-card-container/user-cards-container.component";
import ProfilePicture from "../profile-picture/profile-picture.component";
import Overlay from "../overlay/overlay.component";
import LoadingSpinner from "../loading-spinner/loading-spinner.component";
import { IChat } from "../chat-card/chat-card.component";
import { IUser } from "../user-card/user-card.component";

const Navigation = () => {
  const [openSearch, setOpenSearch] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chats, setChats] = useState<null | IChat[]>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState<
    null | IUser[]
  >(null);

  const { user } = useUser();
  const socket = useContext(WebSocketContext);

  const navigate = useNavigate();

  // search input listener
  useEffect(() => {
    if (!socket) return;

    socket.on("search-result", (res) => {
      setSearchResult(res);
    });

    return () => {
      socket.off("search-result");
    };
  }, [socket]);

  // Connection status listener
  useEffect(() => {
    if (!socket) {
      return setIsConnected(false);
    }
    setIsConnected(true);
  }, [socket]);

  // New chat
  useEffect(() => {
    if (!chats || !socket) return;
    socket.on("new-chat-created", (chat) => {
      setChats((prev) => [chat, ...(prev as IChat[])]);
      toggleSearch();
      navigate("/chat/" + chat.id);
    });
    socket.on("new-chat", (chat) => {
      setChats((prev) => [chat, ...(prev as IChat[])]);
    });
    socket.on("chat-exists", ({ chatId }) => {
      toggleSearch();
      navigate("/chat/" + chatId);
    });

    return () => {
      socket.off("new-chat-created");
      socket.off("new-chat");
      socket.off("chat-exists");
    };
  }, [chats, socket]);

  // Initial chats fetch
  useEffect(() => {
    fetcher("/api/chats", { method: "GET" })
      .then((chats) => {
        setChats(chats);
      })
      .catch((error) => {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Something went wrong.");
        }
      });
  }, []);

  // Search close key listener
  useEffect(() => {
    if (!openSearch) return;

    const escapeEventFunction = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        toggleSearch();
      }
    };

    globalThis.addEventListener(
      "keyup",
      escapeEventFunction
    );

    return () => {
      globalThis.removeEventListener(
        "keyup",
        escapeEventFunction
      );
    };
  }, [openSearch]);

  const toggleSearch = () => {
    setOpenSearch((prev) => !prev);
    setSearchInput("");
    setSearchResult(null);
  };

  const toggleMenu = () => {
    setOpenMenu((prev) => !prev);
  };

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearchInput(event.target.value);

    if (event.target.value.length >= 3) {
      socket?.emit("search", { query: event.target.value });
    }
  };

  if (!user) {
    return (
      <div className="pt-52">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      {/* Header (seach bar, menu, connection status) */}
      <div className="p-3 pb-0 border-b border-neutral-100 dark:border-neutral-500">
        <header className="relative flex justify-between pb-3">
          {/* The menu */}
          <button
            onClick={toggleMenu}
            className="text-lg p-2 pl-0 mr-8"
          >
            <VscMenu />
          </button>
          {openMenu && <Overlay handleClick={toggleMenu} />}
          <nav
            className={`fixed left-0 inset-y-0 z-40 inset-0 transition-transform duration-200 w-2/3 sm:w-64 md:w-72 lg:w-80 xl:w-96 bg-neutral-800 ${
              openMenu
                ? "translate-x-0"
                : "-translate-x-full"
            } `}
          >
            <div className="h-1/6 border-b p-4 sm:p-6 pb-2">
              <div className="w-16 h-16">
                <ProfilePicture
                  user={{
                    displayName: user.displayName,
                    profilePicure: user.profilePicure,
                  }}
                />
              </div>
              <p className="pt-4 capitalize">
                {user.displayName}
              </p>
              <p className="opacity-60">{user.email}</p>
            </div>
            <div className="h-5/6 flex flex-col justify-between">
              <div>
                {/*TODO - Bunch of updates to fill the sapace things like update username email display name password etc */}
              </div>
              <div className="w-full px-4 sm:px-6 hover:bg-neutral-700">
                <a
                  href="/api/auth/signout"
                  title="Click to sign out"
                  className="h-12 text-red-500 text-lg flex items-center space-x-2"
                >
                  <VscSignOut />
                  <span> Signout</span>
                </a>
              </div>
            </div>
          </nav>
          {/* Connection status and search bar toggle*/}
          <div className="flex-1 w-full flex justify-between">
            <p className="text-2xl">
              {isConnected ? (
                <span className="tracking-tight font-semibold">
                  Chat app
                </span>
              ) : (
                <span className="animate-pulse">
                  Connecting...
                </span>
              )}
            </p>
            <button
              className="-rotate-90 text-lg"
              type="button"
              onClick={toggleSearch}
            >
              <VscSearch />
            </button>
          </div>
          {/* Search bar */}
          {openSearch && (
            <form className="absolute z-10 left-0 bg-neutral-700 rounded-md overflow-hidden w-full">
              <div>
                <label
                  htmlFor="user-search"
                  className="sr-only"
                >
                  Search
                </label>
                <div className="flex h-8 pr-1">
                  <input
                    className="w-full pl-4 pr-6 bg-transparent focus:outline-none "
                    type="text"
                    name="search"
                    id="user-search"
                    placeholder="Search"
                    value={searchInput}
                    onChange={handleSearchChange}
                    autoFocus
                  />

                  <button
                    className="text-lg"
                    type="button"
                    onClick={toggleSearch}
                  >
                    <VscClose />
                  </button>
                </div>
              </div>
            </form>
          )}
        </header>
      </div>
      {/* Chat cards container - can be filled with users's chats or search results for new chats */}
      {openSearch ? (
        searchInput.length >= 3 ? (
          <UserCardsContainer users={searchResult} />
        ) : (
          <div className="flex justify-center items-center text-center text-xl p-12 sm:p-2 h-full select-none">
            <p>
              Search by name, username, id or email address
            </p>
          </div>
        )
      ) : chats ? (
        chats.length > 0 ? (
          <ChatCardsContainer chats={chats} />
        ) : (
          <div className="flex flex-col justify-center items-center h-full select-none space-y-4 p-12 sm:px-4 text-center">
            <p className="text-2xl">
              You haven't started a converstion yet.
            </p>
            <p className="text-sm">
              You can start chatting by searching for people
              you know and begin a conversation with them;
              after that, your chats will be listed here.
            </p>
            <button
              type="button"
              onClick={toggleSearch}
              className="border rounded-md px-2 py-1 hover:bg-neutral-900"
            >
              Search now
            </button>
          </div>
        )
      ) : (
        <div className="py-72 text-3xl">
          <LoadingSpinner />
        </div>
      )}
    </>
  );
};

export default Navigation;
