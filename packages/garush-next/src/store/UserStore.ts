export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    walletAddress?: string;
    isActive?: boolean;
    loggedIn?: boolean;
}
interface UserState {
    user?: User;
}

export enum UserActionTypes {
    USER_LOGIN = 'USER_LOGIN',
    USER_LOGOUT = 'USER_LOGOUT',
}

const UserStore = {
    state: {
        user: {},
    } as UserState,
    mutations: {
        USER_SET(state: UserState, user: User): void {
            state.user = user;
        },
    },
    actions: {
        async USER_LOGIN(context: any): Promise<void> {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            console.log('got the action response - login');
            context.mutations.USER_SET({
                id: 1,
                name: 'garush',
                email: 'baha@symbol.dev',
                avatar: 'https://avatars0.githubusercontent.com/u/1234?s=460&v=4',
                walletAddress: '0x123456789',
                isActive: true,
                loggedIn: true,
            });
        },
        async USER_LOGOUT(context: any): Promise<void> {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            console.log('got the action response - logout');
            context.mutations.USER_SET({});
        },
    },
    getters: {
        user(state: UserState): User | undefined {
            return state.user;
        },
    },
};
export default UserStore;
