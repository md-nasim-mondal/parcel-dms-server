/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { ParcelStatus } from "../parcel/parcel.interface";
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

const getSenderStats = async (senderId: string) => {
  // Ensure senderId is treated as ObjectId in queries
  const senderObjectId = new Types.ObjectId(senderId);

  // Total parcels sent by this sender
  const totalParcelsPromise = Parcel.countDocuments({ sender: senderObjectId });

  // Parcels grouped by status
  const parcelsByStatusPromise = Parcel.aggregate([
    { $match: { sender: senderObjectId } },
    {
      $group: {
        _id: "$currentStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  // Parcels grouped by type
  const parcelsByTypePromise = Parcel.aggregate([
    { $match: { sender: senderObjectId } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
  ]);

  // Parcels grouped by shippingType
  const parcelsByShippingTypePromise = Parcel.aggregate([
    { $match: { sender: senderObjectId } },
    {
      $group: {
        _id: "$shippingType",
        count: { $sum: 1 },
      },
    },
  ]);

  // Average fee of sent parcels
  const avgFeePromise = Parcel.aggregate([
    { $match: { sender: senderObjectId } },
    {
      $group: {
        _id: null,
        avgFee: { $avg: "$fee" },
      },
    },
  ]);

  // Parcels created in last 7, 14, 30 days
  const parcelsLast7DaysPromise = Parcel.countDocuments({
    sender: senderObjectId,
    createdAt: { $gte: sevenDaysAgo },
  });
  const parcelsLast14DaysPromise = Parcel.countDocuments({
    sender: senderObjectId,
    createdAt: { $gte: fourteenDaysAgo },
  });
  const parcelsLast30DaysPromise = Parcel.countDocuments({
    sender: senderObjectId,
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Unique receivers this sender has sent to
  const uniqueReceiversPromise = Parcel.distinct("receiver", {
    sender: senderObjectId,
  }).then((arr: any[]) => arr.length);

  // Count of parcels per receiver
  const parcelsPerReceiverPromise = Parcel.aggregate([
    { $match: { sender: senderObjectId } },
    {
      $group: {
        _id: "$receiver",
        count: { $sum: 1 },
      },
    },
  ]);

  const [
    totalParcels,
    parcelsByStatus,
    parcelsByType,
    parcelsByShippingType,
    avgFee,
    parcelsLast7Days,
    parcelsLast14Days,
    parcelsLast30Days,
    uniqueReceivers,
    parcelsPerReceiver,
  ] = await Promise.all([
    totalParcelsPromise,
    parcelsByStatusPromise,
    parcelsByTypePromise,
    parcelsByShippingTypePromise,
    avgFeePromise,
    parcelsLast7DaysPromise,
    parcelsLast14DaysPromise,
    parcelsLast30DaysPromise,
    uniqueReceiversPromise,
    parcelsPerReceiverPromise,
  ]);

  return {
    totalParcels,
    parcelsByStatus,
    parcelsByType,
    parcelsByShippingType,
    avgFee: avgFee[0]?.avgFee ?? 0,
    parcelsLast7Days,
    parcelsLast14Days,
    parcelsLast30Days,
    uniqueReceivers,
    parcelsPerReceiver,
  };
};

const getReceiverStats = async (receiverId: string) => {
  const totalIncomingParcelsPromise = Parcel.countDocuments({
    receiver: receiverId,
    currentStatus: {
      $nin: [
        ParcelStatus.DELIVERED,
        ParcelStatus.FLAGGED,
        ParcelStatus.RETURNED,
        ParcelStatus.BLOCKED,
        ParcelStatus.CANCELLED,
      ],
    },
  });

  const totalInTransitParcelsPromise = Parcel.countDocuments({
    receiver: receiverId,
    currentStatus: ParcelStatus.IN_TRANSIT,
  });
  const totalDeliveredParcelsPromise = Parcel.countDocuments({
    receiver: receiverId,
    currentStatus: ParcelStatus.DELIVERED,
  });

  const [totalIncomingParcels, totalDeliveredParcels, totalInTransitParcels] =
    await Promise.all([
      totalIncomingParcelsPromise,
      totalDeliveredParcelsPromise,
      totalInTransitParcelsPromise,
    ]);

  return {
    totalIncomingParcels,
    totalDeliveredParcels,
    totalInTransitParcels,
  };
};

export const StatsService = {
  // system stats for admin
  getParcelsStats,
  getUserStats,

  // receiver stats for receiver
  getReceiverStats,

  // sender stats for sender
  getSenderStats,
};
