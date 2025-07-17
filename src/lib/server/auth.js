import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { WeChatProvider } from '@next-auth-oauth/wechat';

import prisma from '@/prisma/index';
import { html, text } from '@/config/email-templates/signin';
import { emailConfig, sendMail } from '@/lib/server/mail';
import { createPaymentAccount, getPayment } from '@/prisma/services/customer';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        if (user.isAdmin) token.isAdmin = true;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token) {
        session.user.userId = token.userId;
        session.user.email = token.email;
        if (token.isAdmin) {
          session.user.isAdmin = true;
        } else {
          const customerPayment = await getPayment(token.email);
          if (customerPayment) {
            session.user.subscription = customerPayment.subscriptionType;
          }
        }
      }

      return session;
    },
  },
  debug: !(process.env.NODE_ENV === 'production'),
  events: {
    signIn: async ({ user, isNewUser }) => {
      if (user.isAdmin) return;
      const customerPayment = await getPayment(user.email);

      if (isNewUser || customerPayment === null || user.createdAt === null) {
        await Promise.all([createPaymentAccount(user.email, user.id)]);
      }
    },
  },
  providers: [
    ...(process.env.GLOBAL_ADMIN_USERNAME && process.env.GLOBAL_ADMIN_PASSWORD
      ? [
          CredentialsProvider({
            id: 'admin',
            name: 'Admin',
            credentials: {
              username: { label: 'Username', type: 'text' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              if (
                credentials.username === process.env.GLOBAL_ADMIN_USERNAME &&
                credentials.password === process.env.GLOBAL_ADMIN_PASSWORD
              ) {
                return {
                  id: 'admin',
                  email: process.env.GLOBAL_ADMIN_USERNAME,
                  name: 'Admin',
                  isAdmin: true,
                };
              }
              return null;
            },
          }),
        ]
      : []),
    EmailProvider({
      from: process.env.EMAIL_FROM,
      server: emailConfig,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const { host } = new URL(url);
        await sendMail({
          html: html({ email, url }),
          subject: `[Nextacular] Sign in to ${host}`,
          text: text({ email, url }),
          to: email,
        });
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    WeChatProvider({
      clientId: process.env.WECHAT_CLIENT_ID,
      clientSecret: process.env.WECHAT_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || null,
  session: {
    jwt: true,
  },
};
