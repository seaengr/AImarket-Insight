declare module "*.module.css" {
    const classes: { [key: string]: string };
    export default classes;
}

declare module "*.css" {
    const content: string;
    export default content;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.gif";
