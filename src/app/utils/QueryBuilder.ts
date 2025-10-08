import { Query } from "mongoose";
import { excludeField } from "../constants";

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  filter(): this {
    const filter = { ...this.query };

    for (const field of excludeField) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete filter[field];
    }

    // FIX 1: remove empty filed
    Object.keys(filter).forEach((key) => {
      if (!filter[key]) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete filter[key];
      }
    });

    const caseInsensitiveFilter: Record<string, unknown> = {};
    Object.keys(filter).forEach((key) => {
      const value = filter[key];

      // isVerified ফিল্ডটিকে বিশেষভাবে হ্যান্ডেল করুন
      if (key === "isVerified") {
        caseInsensitiveFilter[key] = value === "true"; // স্ট্রিং "true" কে boolean true তে কনভার্ট করুন
      } else if (typeof value === "string") {
        // অন্যান্য স্ট্রিং ফিল্ডের জন্য আগের মতোই regex ব্যবহার করুন
        caseInsensitiveFilter[key] = { $regex: new RegExp(`^${value}$`, "i") };
      } else {
        // অন্য কোনো টাইপ থাকলে সরাসরি সেট করুন
        caseInsensitiveFilter[key] = value;
      }
    });

    this.modelQuery = this.modelQuery.find(
      caseInsensitiveFilter as Record<string, unknown>
    );

    return this;
  }

  search(searchableField: string[]): this {
    const searchTerm = this.query.searchTerm;

    // FIX 2: if searchTerm than used search query
    if (searchTerm) {
      const searchQuery = {
        $or: searchableField.map((field) => ({
          [field]: { $regex: searchTerm, $options: "i" },
        })),
      };
      this.modelQuery = this.modelQuery.find(searchQuery);
    }

    return this;
  }

  sort(): this {
    const sort = this.query.sort || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }

  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;
    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  build() {
    return this.modelQuery;
  }

  async getMeta() {
    const filterQuery = this.modelQuery.getFilter();
    const totalDocuments = await this.modelQuery.model.countDocuments(
      filterQuery
    );
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(totalDocuments / limit);

    return { page, limit, total: totalDocuments, totalPage };
  }
}