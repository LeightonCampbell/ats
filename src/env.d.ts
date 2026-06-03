/// <reference types="astro/client" />

type RuntimeEnv = {
  PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  ZOOM_ACCOUNT_ID?: string;
  ZOOM_CLIENT_ID?: string;
  ZOOM_CLIENT_SECRET?: string;
  ZOOM_HOST_EMAIL?: string;
  ZOOM_HOST_USER_ID?: string;
  FORMSPREE_FORM_ID?: string;
  FORMSPREE_CONTACT_FORM_ID?: string;
};

declare namespace App {
  interface Locals {
    cfContext?: ExecutionContext;
  }
}
