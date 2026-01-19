import mongoose from "mongoose";

const DescriptionSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true
        },
        subcontent: {
            type: [String],
            default: []
        }
    },
    { _id: false }
);

const SectionSchema = new mongoose.Schema(
    {
        order: Number,
        title: String,
        description: DescriptionSchema
    },
    { _id: false }
);

const ArticleSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["page", "blog"],
            default: "page"
        },
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft"
        },
        title: String,
        slug: {
            type: String,
            unique: true
        },
        seo: {
            metaTitle: String,
            metaDescription: String
        },
        thumbnail: String,
        content: {
            intro: String,
            sections: [SectionSchema],
            conclusion: String
        },
        tags: [String],
        language: {
            type: String,
            default: "vi"
        }
    },
    { timestamps: true }
);
const Article = mongoose.model('Article', ArticleSchema);

export default Article;
