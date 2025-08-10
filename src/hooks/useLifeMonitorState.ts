"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';

export type Perspective = 'ELAPSED' | 'REMAINING';
export type EditableField = 'year' | 'month' | 'day' | 'lifeExpectancy';

export interface LifeMonitorState {
  perspective: Perspective;
  birthDate: Date | null;
  lifeExpectancy: number | null;
  isEditing: boolean;

  // Draft state for editing
  draftYear: number;
  draftMonth: number;
  draftDay: number;
  draftLifeExpectancy: number;
  activeField: EditableField;
}

export const useLifeMonitorState = () => {
  const [state, setState] = useState<LifeMonitorState>({
    perspective: 'ELAPSED',
    birthDate: null,
    lifeExpectancy: null,
    isEditing: false,
    // Draft state
    draftYear: 1990,
    draftMonth: 1,
    draftDay: 1,
    draftLifeExpectancy: 80,
    activeField: 'year',
  });

  // Load from localStorage on initial mount
  useEffect(() => {
    try {
      const savedBirthDate = localStorage.getItem('birthDate');
      const savedLifeExpectancy = localStorage.getItem('lifeExpectancy');

      if (savedBirthDate && savedLifeExpectancy) {
        const birthDate = new Date(savedBirthDate);
        const lifeExpectancy = parseInt(savedLifeExpectancy, 10);
        setState((prevState) => ({
          ...prevState,
          birthDate,
          lifeExpectancy,
          draftYear: birthDate.getUTCFullYear(),
          draftMonth: birthDate.getUTCMonth() + 1,
          draftDay: birthDate.getUTCDate(),
          draftLifeExpectancy: lifeExpectancy,
        }));
      } else {
        setState((prevState) => ({ ...prevState, isEditing: true }));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setState((prevState) => ({ ...prevState, isEditing: true }));
    }
  }, []);

  // Save to localStorage whenever birthDate or lifeExpectancy changes
  useEffect(() => {
    if (state.birthDate && state.lifeExpectancy) {
      try {
        localStorage.setItem('birthDate', state.birthDate.toISOString());
        localStorage.setItem('lifeExpectancy', state.lifeExpectancy.toString());
      } catch (error) {
        console.error("Failed to access localStorage:", error);
      }
    }
  }, [state.birthDate, state.lifeExpectancy]);


  const togglePerspective = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      perspective: prevState.perspective === 'ELAPSED' ? 'REMAINING' : 'ELAPSED',
    }));
  }, []);

  const setUserData = useCallback((birthDate: Date, lifeExpectancy: number) => {
    const clampedLifeExpectancy = Math.max(10, Math.min(lifeExpectancy, 999));
    setState((prevState) => ({
      ...prevState,
      birthDate,
      lifeExpectancy: clampedLifeExpectancy,
      isEditing: false,
    }));
  }, []);

  const setIsEditing = useCallback((isEditing: boolean) => {
    setState((prevState) => {
      // When entering editing mode, ensure draft state is up to date
      if (isEditing && prevState.birthDate && prevState.lifeExpectancy) {
        return {
          ...prevState,
          isEditing: true,
          draftYear: prevState.birthDate.getUTCFullYear(),
          draftMonth: prevState.birthDate.getUTCMonth() + 1,
          draftDay: prevState.birthDate.getUTCDate(),
          draftLifeExpectancy: prevState.lifeExpectancy,
        };
      }
      return { ...prevState, isEditing };
    });
  }, []);

  const setActiveField = useCallback((field: EditableField) => {
    setState((prevState) => ({ ...prevState, activeField: field }));
  }, []);

  const handleConfirm = useCallback(() => {
    setUserData(
      new Date(Date.UTC(state.draftYear, state.draftMonth - 1, state.draftDay)),
      state.draftLifeExpectancy
    );
  }, [state.draftYear, state.draftMonth, state.draftDay, state.draftLifeExpectancy, setUserData]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    // Reset draft state to match confirmed state
    if (state.birthDate && state.lifeExpectancy) {
        setState(s => ({
            ...s,
            draftYear: s.birthDate!.getUTCFullYear(),
            draftMonth: s.birthDate!.getUTCMonth() + 1,
            draftDay: s.birthDate!.getUTCDate(),
            draftLifeExpectancy: s.lifeExpectancy!,
        }));
    }
  }, [state.birthDate, state.lifeExpectancy, setIsEditing]);

  // Keyboard controls for editing mode
  useEffect(() => {
    if (!state.isEditing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        event.preventDefault();
        setState(s => {
            const newS = { ...s };
            switch (s.activeField) {
                case 'year':
                    newS.draftYear = Math.floor(s.draftYear / 10);
                    break;
                case 'month':
                    newS.draftMonth = Math.floor(s.draftMonth / 10);
                    break;
                case 'day':
                    newS.draftDay = Math.floor(s.draftDay / 10);
                    break;
                case 'lifeExpectancy':
                    newS.draftLifeExpectancy = Math.floor(s.draftLifeExpectancy / 10);
                    break;
            }
            return newS;
        });
        return;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        const digit = parseInt(event.key, 10);
        setState(s => {
            const newS = { ...s };
            switch (s.activeField) {
                case 'year':
                    const potentialYear = s.draftYear * 10 + digit;
                    newS.draftYear = potentialYear > 9999 ? digit : potentialYear;
                    break;
                case 'month':
                    const potentialMonth = s.draftMonth * 10 + digit;
                    if (potentialMonth > 12) {
                        newS.draftMonth = digit > 0 ? digit : 1;
                    } else {
                        newS.draftMonth = potentialMonth === 0 ? 1 : potentialMonth;
                    }
                    break;
                case 'day':
                    const maxDays = new Date(s.draftYear, s.draftMonth, 0).getDate();
                    const potentialDay = s.draftDay * 10 + digit;
                     if (potentialDay > maxDays) {
                        newS.draftDay = digit > 0 ? digit : 1;
                    } else {
                        newS.draftDay = potentialDay === 0 ? 1 : potentialDay;
                    }
                    break;
                case 'lifeExpectancy':
                    const potentialValue = s.draftLifeExpectancy * 10 + digit;
                    newS.draftLifeExpectancy = potentialValue > 999 ? digit : potentialValue;
                    if (newS.draftLifeExpectancy === 0) newS.draftLifeExpectancy = digit > 0 ? digit : 1;
                    break;
            }
            return newS;
        });
        return;
      }
      
      if (event.key === 'Enter') {
        handleConfirm();
        return;
      }
      if (event.key === 'Escape' || event.key === 'e' || event.key === 'E') {
        handleCancel();
        return;
      }

      const fieldOrder: EditableField[] = ['year', 'month', 'day', 'lifeExpectancy'];
      const currentIndex = fieldOrder.indexOf(state.activeField);

      const adjustValue = (amount: number) => {
        setState(s => {
            const newS = {...s};
            switch (s.activeField) {
                case 'year':
                    newS.draftYear += amount;
                    break;
                case 'month':
                    const newMonth = s.draftMonth + amount;
                    if (newMonth > 12) newS.draftMonth = 1;
                    else if (newMonth < 1) newS.draftMonth = 12;
                    else newS.draftMonth = newMonth;
                    break;
                case 'day':
                    const maxDays = new Date(s.draftYear, s.draftMonth, 0).getDate();
                    const newDay = s.draftDay + amount;
                    if (newDay > maxDays) newS.draftDay = 1;
                    else if (newDay < 1) newS.draftDay = maxDays;
                    else newS.draftDay = newDay;
                    break;
                case 'lifeExpectancy':
                    let newLifeExpectancy = s.draftLifeExpectancy + amount;
                    if (newLifeExpectancy > 999) newLifeExpectancy = 10;
                    if (newLifeExpectancy < 10) newLifeExpectancy = 999;
                    newS.draftLifeExpectancy = newLifeExpectancy;
                    break;
            }
            return newS;
        });
      };

      switch (event.key) {
        case 'ArrowRight':
        case 'Tab':
          event.preventDefault();
          setState(s => ({...s, activeField: fieldOrder[(currentIndex + 1) % fieldOrder.length]}));
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setState(s => ({...s, activeField: fieldOrder[(currentIndex - 1 + fieldOrder.length) % fieldOrder.length]}));
          break;
        case 'ArrowUp':
          event.preventDefault();
          adjustValue(1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          adjustValue(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isEditing, state.activeField, state.draftYear, state.draftMonth, state.draftDay, state.draftLifeExpectancy, handleConfirm, handleCancel]);

  const actions = useMemo(
    () => ({
      togglePerspective,
      setUserData,
      setIsEditing,
      setActiveField,
      handleConfirm,
      handleCancel,
    }),
    [togglePerspective, setUserData, setIsEditing, setActiveField, handleConfirm, handleCancel]
  );

  return {
    state,
    actions,
  };
};