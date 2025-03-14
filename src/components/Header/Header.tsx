import classNames from 'classnames';
import { ActiveSelect } from '../ActiveSelect';
import styles from './Header.module.scss';
import { Portal } from '~/ui/Portal';
import { Modal } from '~/ui/Modal';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { setIsShowActiveSelect } from '~/store/data';

export function Header() {
  const isShowActiveSelectModal = useAppSelector((state) => state.data.isShowActiveSelect);
  const dispatch = useAppDispatch();

  return (
    <>
      <Portal>
        <Modal isOpen={isShowActiveSelectModal} onClose={() => dispatch(setIsShowActiveSelect(false))}>
          <ActiveSelect />
        </Modal>
      </Portal>
      <header className={classNames(styles.appHeaderContentWrapper)}>
        <div className={classNames(styles.appHeaderContent, 'global-big-container')}>
          <div className={styles.appHeaderLogo}>PORTFOLIO OVERVIEW</div>
          <div>
            <button className={styles.appHeaderAddActiveBtn} onClick={() => dispatch(setIsShowActiveSelect(true))}>
              Добавить
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
