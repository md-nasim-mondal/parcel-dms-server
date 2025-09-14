/* eslint-disable @typescript-eslint/no-explicit-any */
import { Parcel } from "../parcel/parcel.model";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";

const now = new Date();
const sevenDaysAgo = new Date(now).setDate(now.getDate() - 7);
const fourteenDaysAgo = new Date(now).setDate(now.getDate() - 14);
const thirtyDaysAgo = new Date(now).setDate(now.getDate() - 30);

const getUserStats = async () => {
  const totalUsersPromise = User.countDocuments();

  const totalActiveUsersPromise = User.countDocuments({
    isActive: IsActive.ACTIVE,
  });
  const totalInActiveUsersPromise = User.countDocuments({
    isActive: IsActive.INACTIVE,
  });
  const totalBlockedUsersPromise = User.countDocuments({
    isActive: IsActive.BLOCKED,
  });

  const newUsersInLast7DaysPromise = User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });
  const newUsersInLast30DaysPromise = User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const usersByRolePromise = User.aggregate([
    //stage -1 : Grouping users by role and count total users in each role

    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const [
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
    usersByRole,
  ] = await Promise.all([
    totalUsersPromise,
    totalActiveUsersPromise,
    totalInActiveUsersPromise,
    totalBlockedUsersPromise,
    newUsersInLast7DaysPromise,
    newUsersInLast30DaysPromise,
    usersByRolePromise,
  ]);
  return {
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
    usersByRole,
  };
};

const getParcelsStats = async () => {
  const totalParcelPromise = Parcel.countDocuments();

  const totalParcelByStatusPromise = Parcel.aggregate([
    //stage-1 group stage
    {
      $group: {
        _id: "$currentStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const parcelPerTypePromise = Parcel.aggregate([
    //stage-1 group stage
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
  ]);

  const parcelPerShippingTypePromise = Parcel.aggregate([
    //stage-1 group stage
    {
      $group: {
        _id: "$shippingType",
        count: { $sum: 1 },
      },
    },
  ]);

  const avgFeePerParcelPromise = Parcel.aggregate([
    // stage 1  - group stage
    {
      $group: {
        _id: null,
        avgFee: { $avg: "$fee" },
      },
    },
  ]);

  const parcelCreatedInLast7DaysPromise = Parcel.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  const parcelCreatedInLast14DaysPromise = Parcel.countDocuments({
    createdAt: { $gte: fourteenDaysAgo },
  });

  const parcelCreatedInLast30DaysPromise = Parcel.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const totalParcelCreatedByUniqueSenderPromise = Parcel.distinct(
    "sender"
  ).then((user: any) => user.length);

  const totalParcelReceiverByUniqueReceiverPromise = Parcel.distinct(
    "receiver"
  ).then((user: any) => user.length);

  const [
    totalParcel,
    totalParcelByStatus,
    parcelPerType,
    parcelPerShippingType,
    avgFeePerParcel,
    parcelCreatedInLast7Days,
    parcelCreatedInLast14Days,
    parcelCreatedInLast30Days,
    totalParcelCreatedByUniqueSender,
    totalParcelReceiverByUniqueReceiver,
  ] = await Promise.all([
    totalParcelPromise,
    totalParcelByStatusPromise,
    parcelPerTypePromise,
    parcelPerShippingTypePromise,
    avgFeePerParcelPromise,
    parcelCreatedInLast7DaysPromise,
    parcelCreatedInLast14DaysPromise,
    parcelCreatedInLast30DaysPromise,
    totalParcelCreatedByUniqueSenderPromise,
    totalParcelReceiverByUniqueReceiverPromise,
  ]);

  return {
    totalParcel,
    totalParcelByStatus,
    parcelPerType,
    parcelPerShippingType,
    avgFeePerParcel,
    parcelCreatedInLast7Days,
    parcelCreatedInLast14Days,
    parcelCreatedInLast30Days,
    totalParcelCreatedByUniqueSender,
    totalParcelReceiverByUniqueReceiver,
  };
};

export const StatsService = {
  getParcelsStats,
  getUserStats,
};
