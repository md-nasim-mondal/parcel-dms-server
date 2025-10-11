import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import { IUser, Role, IsActive } from "./user.interface";
import { User } from "./user.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userSearchableFields } from "./user.constant";
import { envVars } from "../../config/env";

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  // 1. Non-admin users can only update their own profile
  if (
    decodedToken.role === Role.SENDER ||
    decodedToken.role === Role.RECEIVER ||
    decodedToken.role === Role.DELIVERY_PERSONNEL
  ) {
    if (userId !== decodedToken.userId) {
      throw new AppError(401, "You are not authorized!");
    }
  }

  const ifUserExist = await User.findById(userId);
  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  // 2. Admin / Super Admin cannot touch another Super-Admin
  if (
    (decodedToken.role === Role.ADMIN ||
      decodedToken.role === Role.SUPER_ADMIN) &&
    ifUserExist.role === Role.SUPER_ADMIN &&
    userId !== decodedToken.userId
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Admin / Super Admin cannot change another Super Admin's role"
    );
  }

  // 3. Role change validations
  if (payload.role !== undefined) {
    // Only Admin & Super-Admin can change roles
    if (
      decodedToken.role === Role.SENDER ||
      decodedToken.role === Role.RECEIVER ||
      decodedToken.role === Role.DELIVERY_PERSONNEL
    ) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }

    // Admin cannot assign Super-Admin role
    if (payload.role === Role.SUPER_ADMIN && decodedToken.role === Role.ADMIN) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Admin cannot assign Super-Admin role"
      );
    }

    // Super-Admin cannot change own role
    if (
      decodedToken.role === Role.SUPER_ADMIN &&
      userId === decodedToken.userId
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Super Admin cannot change own role"
      );
    }

    // Super-Admin cannot change another Super-Admin's role
    if (
      decodedToken.role === Role.SUPER_ADMIN &&
      ifUserExist.role === Role.SUPER_ADMIN &&
      userId !== decodedToken.userId
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Super Admin cannot change another Super Admin's role"
      );
    }
  }

  // 4. Status flags (isActive, isDeleted, isVerified) can be toggled only by Admin/Super-Admin
  if (
    payload.isActive !== undefined ||
    payload.isDeleted !== undefined ||
    payload.isVerified !== undefined
  ) {
    if (
      decodedToken.role === Role.SENDER ||
      decodedToken.role === Role.RECEIVER ||
      decodedToken.role === Role.DELIVERY_PERSONNEL
    ) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return newUpdatedUser;
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find(), query);
  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);
  return {
    data,
    meta,
  };
};

const getSingleUser = async (id: string) => {
  const user = await User.findById(id).select("-password");
  return {
    data: user,
  };
};
const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const createAdmin = async (
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const { email, password, role, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  if (decodedToken.role == Role.ADMIN && role === Role.SUPER_ADMIN) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to create SUPER_ADMIN"
    );
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const user = await User.create({
    email,
    password: hashedPassword,
    role: Role.ADMIN,
    ...rest,
  });

  return user;
};
const createDeliveryPersonnel = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  const isUserExist = await User.findOne({ email });
  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const user = await User.create({
    email,
    password: hashedPassword,
    role: Role.DELIVERY_PERSONNEL,
    ...rest,
  });

  return user;
};

const blockStatusUser = async (
  userId: string,
  isActive: IsActive,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // check payload status and isActive same
  if (user.isActive === isActive) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `User is already in this ${isActive} status`
    );
  }

  // 2. Admin / Super Admin cannot touch another Super-Admin
  if (
    (decodedToken.role === Role.ADMIN ||
      decodedToken.role === Role.SUPER_ADMIN) &&
    user.role === Role.SUPER_ADMIN &&
    userId !== decodedToken.userId
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Admin / Super Admin cannot change another Super Admin's role"
    );
  }

  user.isActive = isActive;
  if (isActive === IsActive.BLOCKED) {
    user.isActive = IsActive.BLOCKED;
  } else if (isActive === IsActive.INACTIVE) {
    user.isActive = IsActive.INACTIVE;
  } else {
    user.isActive = IsActive.ACTIVE;
  }
  await user.save();
  return user;
};

export const UserServices = {
  getAllUsers,
  updateUser,
  getSingleUser,
  getMe,
  createAdmin,
  createDeliveryPersonnel,
  blockStatusUser,
};
