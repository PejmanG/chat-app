import { prisma } from "../utils/prisma-client";
import {
  IExpressEndpointHandler,
  IChatCard,
} from "../utils/types";

/**
 * @desc   Gets all of the chats of a user
 * @route  GET /api/chats/
 * @access Private
 * */
const getChats: IExpressEndpointHandler = async (
  req,
  res,
  next
) => {
  try {
    const user = req.session.user;
    if (user) {
      const userChats = await prisma.user.findUnique({
        where: {
          id: user.userID,
        },
        select: {
          chats: {
            include: {
              users: {
                where: {
                  NOT: { id: user.userID },
                },
              },
              unreadCount: {
                where: {
                  userId: user.userID,
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      });
      if (userChats) {
        const formattedChats: IChatCard[] =
          userChats.chats.map((chat) => ({
            id: chat.id,
            displayName: chat.users[0].displayName,
            profilePicure: chat.users[0].profilePicure,
            lastMessage: chat.lastMessage,
            lastMessageDate: chat.updatedAt,
            unreadCount: chat.unreadCount[0].unreadCount,
          }));
        return res.json(formattedChats);
      }
    }
    res.status(401);
    throw new Error("Unauthorized.");
  } catch (error) {
    next(error);
  }
};

export { getChats };
