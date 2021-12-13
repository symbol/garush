/*
 * (C) Symbol Contributors 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
    darkMode: boolean;
}

export default function ThemeToggle(props: ThemeToggleProps) {
    const { darkMode } = props;
    const [isOpen, setIsOpen] = useState(darkMode);
    useEffect(() => {
        toggleTheme();
    }, []);
    const toggleTheme = () => {
        if (document.body.classList.contains('dark')) {
            document.body.classList.remove('dark');
            setIsOpen(false);
        } else {
            document.body.classList.add('dark');
            setIsOpen(true);
        }
    };
    return (
        <div className="theme-toggle">
            <div className="theme-toggle__button-icon" onClick={toggleTheme}>
                {isOpen ? <i className="bi bi-sun" style={{ color: 'white' }}></i> : <i className="bi bi-moon"></i>}
            </div>
        </div>
    );
}
